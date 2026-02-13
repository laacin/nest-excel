import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { XlsxService } from './xlsx.service';
import { Format, resolveRow } from 'src/domain/format';
import { CellError, Data, JobInfo, Row, STATUS } from 'src/domain/entity';
import { PERSIST, QUEUE } from 'src/domain/repository';
import type {
  DataFilter,
  PersistRepository,
  QueueService,
} from 'src/domain/repository';
import { BATCH_SIZE } from './config.app';
import { AppErr, PersistErr, FileErr } from 'src/domain/errors';

const JOB_QUEUE = 'job.queue';
interface QueueData {
  jobId: string;
  filename: string;
  format: string;
}

@Injectable()
export class UseCase implements OnModuleInit {
  constructor(
    @Inject(PERSIST) private readonly persist: PersistRepository,
    @Inject(QUEUE) private readonly msg: QueueService<QueueData>,
    @Inject(BATCH_SIZE) private readonly BATCH_SIZE: number,
    private readonly XLSX: XlsxService,
  ) {}

  async onModuleInit() {
    await this.msg.newJob(JOB_QUEUE);
    await this.msg.consumer(
      JOB_QUEUE,
      async (data) => {
        await this.processOnQueue(data);
      },
      { fallback: (e, data) => this.processFails(e, data) },
    );
  }

  // -- Handlers
  async handleUploadFile(filename: string, format: string): Promise<string> {
    try {
      if (!filename.endsWith('.xlsx')) throw FileErr.noXlsx();

      new Format(format); // validate format
      const jobId = crypto.randomUUID();

      await this.persist.storeJob(jobId);
      this.msg.publish(JOB_QUEUE, { jobId, filename, format });

      return jobId;
    } catch (e) {
      throw e instanceof AppErr ? e : AppErr.unknown(e);
    }
  }

  async handleStatusRequest(jobId: string): Promise<STATUS> {
    try {
      const info = await this.persist.getJob(jobId);
      if (!info) throw PersistErr.jobNotFound();

      return info.status;
    } catch (e) {
      throw e instanceof AppErr ? e : AppErr.unknown(e);
    }
  }

  async handleDataRequest(
    jobId: string,
    filter: DataFilter,
  ): Promise<Partial<Data & JobInfo>> {
    try {
      const result = await this.persist.getData(jobId, filter);
      if (!result) throw PersistErr.jobNotFound();
      return result;
    } catch (e) {
      throw e instanceof AppErr ? e : AppErr.unknown(e);
    }
  }

  // -- internal use cases;
  async processOnQueue({ jobId, filename, format }: QueueData): Promise<void> {
    try {
      await this.persist.setAsProcessing(jobId);

      const fmt = new Format(format);

      let columns: string[] = [];
      let colIndex: number[] = [];
      let rawRows: unknown[][] = [];
      let offset = 0;

      await this.XLSX.stream(filename, this.BATCH_SIZE, async (batch) => {
        if (offset === 0) {
          const [cols, ...rows] = batch;

          columns = cols as string[];
          colIndex = fmt.getColIndex(columns);
          rawRows = rows;
        } else {
          rawRows = batch;
        }

        const rows: Row[] = [];
        const errors: CellError[] = [];

        for (let i = 0; i < batch.length; i++) {
          const { row, errs } = resolveRow({
            fmt: fmt.getInfo(),
            colIndex,
            rowData: rawRows[i],
            rowIdx: i + offset,
          });
          if (errs) {
            errors.push(...errs);
          }
          rows.push(row);
        }

        await this.persist.storeData(
          jobId,
          { rows, columns, errors },
          offset === 0,
        );
        offset += batch.length;
      });

      await this.persist.setAsDone(jobId);
    } catch (e) {
      throw e instanceof AppErr ? e : AppErr.unknown(e);
    }
  }

  async processFails(e: unknown, { jobId }: QueueData): Promise<void> {
    const err = e instanceof AppErr ? e : AppErr.unknown(e);
    await this.persist.setAsError(jobId, err.message);
  }
}
