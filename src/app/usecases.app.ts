import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { XlsxService } from './xlsx.service';
import { Format, FormatInfo, resolveRow } from 'src/domain/format';
import { CellError, Row, STATUS } from 'src/domain/entity';
import { PERSIST, QUEUE } from 'src/domain/repository';
import type { PersistRepository, QueueService } from 'src/domain/repository';
import { BATCH_SIZE, QUEUE_JOB_NAME } from './config.app';
import { AppErr, PersistErr, FileErr } from 'src/domain/errors';

interface QueueData {
  jobId: string;
  filename: string;
  format: string;
}

type DataRequest =
  | {
      which: 'rows';
      mapped?: boolean;
      page: number;
      take: number;
      desc?: boolean;
    }
  | {
      which: 'errors';
      page: number;
      take: number;
      desc?: boolean;
    };

@Injectable()
export class UseCase implements OnModuleInit {
  constructor(
    @Inject(PERSIST) private readonly persist: PersistRepository,
    @Inject(QUEUE) private readonly msg: QueueService<QueueData>,
    @Inject(BATCH_SIZE) private readonly BATCH_SIZE: number,
    private readonly XLSX: XlsxService,
  ) {}

  async onModuleInit() {
    await this.msg.newJob(QUEUE_JOB_NAME);
    await this.msg.consumer(
      QUEUE_JOB_NAME,
      async (data) => {
        await this.processOnQueue(data);
      },
      { fallback: (e, data) => this.processFails(e, data) },
    );
  }

  async handleUploadFile(filename: string, format: string): Promise<unknown> {
    try {
      if (!filename.endsWith('.xlsx')) throw FileErr.noXlsx();

      new Format(format); // validate format
      const jobId = crypto.randomUUID();

      await this.persist.storeJob(jobId);
      this.msg.publish(QUEUE_JOB_NAME, { jobId, filename, format });

      return { jobId };
    } catch (e) {
      throw e instanceof AppErr ? e : AppErr.unknown(e);
    }
  }

  async handleStatusRequest(jobId: string): Promise<unknown> {
    try {
      const info = await this.persist.getJob(jobId);
      if (!info) throw PersistErr.jobNotFound();

      const result = {};
      result['status'] = info.status;

      if (info.status === STATUS.ERROR) {
        result['reason'] = info.error;
      }

      return result;
    } catch (e) {
      throw e instanceof AppErr ? e : AppErr.unknown(e);
    }
  }

  async handleDataRequest(jobId: string, req: DataRequest): Promise<unknown> {
    try {
      const limit = req.take;
      const offset = (Math.max(1, req.page) - 1) * limit;

      const result =
        req.which === 'rows'
          ? await this.persist.getRows(
              jobId,
              { limit, offset, desc: req.desc },
              req.mapped,
            )
          : await this.persist.getErrors(jobId, {
              limit,
              offset,
              desc: req.desc,
            });

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

      const columns: string[] = [];
      let colIndex: number[] = [];
      let fmtInfo: FormatInfo[] = [];
      let rawRows: unknown[][] = [];
      let offset = 0;

      await this.XLSX.stream(filename, this.BATCH_SIZE, async (batch) => {
        if (offset === 0) {
          const [cols, ...rows] = batch;

          colIndex = fmt.getColIndex(cols as string[]);
          colIndex.forEach((i) => columns.push((cols as string[])[i]));
          fmtInfo = fmt.getInfo();
          rawRows = rows;
        } else {
          rawRows = batch;
        }

        const rows: Row[] = [];
        const errors: CellError[] = [];

        for (let i = 0; i < rawRows.length; i++) {
          const { row, errs } = resolveRow({
            fmt: fmtInfo,
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
          offset !== 0,
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
