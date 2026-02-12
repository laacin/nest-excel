import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { XlsxService } from './xlsx.service';
import { Format, resolveRow } from 'src/domain/format';
import { CellError, Data, Row, STATUS } from 'src/domain/entity';
import { PERSIST, QUEUE } from 'src/domain/repository';
import type {
  DataFilter,
  PersistLayer,
  QueueService,
} from 'src/domain/repository';
import {
  PROCESS_BATCH_SIZE,
  PROCESS_JOB_NAME,
  READ_BATCH_SIZE,
  READ_JOB_NAME,
} from './config.app';
import { AppErr, PersistErr, XlsxError } from 'src/domain/errors';

@Injectable()
export class UseCase implements OnModuleInit {
  constructor(
    @Inject(PERSIST) private readonly persist: PersistLayer,
    @Inject(QUEUE) private readonly msg: QueueService,
    @Inject(READ_BATCH_SIZE) private readonly READ_BZ: number,
    @Inject(PROCESS_BATCH_SIZE) private readonly PROCESS_BZ: number,
    @Inject(READ_JOB_NAME) private readonly READ_JOB: string,
    @Inject(PROCESS_JOB_NAME) private readonly PROCESS_JOB: string,
    private readonly XLSX: XlsxService,
  ) {}

  async onModuleInit() {
    await Promise.all([
      this.msg.newJob(this.READ_JOB),
      this.msg.newJob(this.PROCESS_JOB),
    ]);

    const uploadConsumer = this.msg.consumer(this.READ_JOB, async (data) => {
      const { jobId, filename, format } = JSON.parse(data) as Record<
        string,
        string
      >;
      await this.uploadFile(jobId, filename, format);
    });

    const procConsumer = this.msg.consumer(
      this.PROCESS_JOB,
      async (data) => {
        await this.processData(data);
      },
      { fallback: async (e, d) => this.processDataError(e, d) },
    );

    await Promise.all([uploadConsumer, procConsumer]);
  }

  // -- Handlers
  async handleUploadReq(filename: string, format: string): Promise<string> {
    try {
      if (!filename.endsWith('.xlsx')) throw XlsxError.noXlsxFile();
      new Format(format);

      const jobId = crypto.randomUUID();

      await this.persist.setAsPending(jobId);
      this.msg.publish(
        this.READ_JOB,
        JSON.stringify({ jobId, filename, format }),
      );

      return jobId;
    } catch (e) {
      throw e instanceof AppErr ? e : AppErr.unknown(e);
    }
  }

  async handleStatusReq(jobId: string): Promise<STATUS> {
    try {
      const status = await this.persist.getJobStatus(jobId);
      if (!status) throw PersistErr.jobNotFound();
      return status;
    } catch (e) {
      throw e instanceof AppErr ? e : AppErr.unknown(e);
    }
  }

  async handleResultReq(
    jobId: string,
    filter: DataFilter,
  ): Promise<Partial<Data>> {
    try {
      const data = await this.persist.getData(jobId, filter);
      if (!data) throw PersistErr.jobNotFound();
      return data;
    } catch (e) {
      throw e instanceof AppErr ? e : AppErr.unknown(e);
    }
  }

  // -- internal use cases;
  async uploadFile(
    jobId: string,
    filename: string,
    format: string,
  ): Promise<void> {
    try {
      let first = true;
      await this.XLSX.stream(filename, this.READ_BZ, async (b) => {
        if (first) {
          const [cols, ...rows] = b;
          await Promise.all([
            this.persist.storeJob({ jobId, format, cols: cols as string[] }),
            this.persist.addRowsToJob(jobId, rows),
          ]);
          first = false;
        } else {
          await this.persist.addRowsToJob(jobId, b);
        }
      });

      this.msg.publish(this.PROCESS_JOB, jobId);
    } catch (e) {
      throw e instanceof AppErr ? e : AppErr.unknown(e);
    }
  }

  async processData(jobId: string): Promise<void> {
    try {
      await this.persist.setAsProcessing(jobId);

      const jobInfo = await this.persist.getJobInfo(jobId);
      if (!jobInfo) throw PersistErr.jobNotFound();

      const fmt = new Format(jobInfo.format);
      const colIndex = fmt.getColIndex(jobInfo.cols);

      let offset = 0;
      let batch: unknown[][] = [];
      do {
        batch = await this.persist.getJobData(jobId, this.PROCESS_BZ, offset);
        if (!batch.length) break;

        let rows: Row[] = [];
        let errors: CellError[] = [];

        for (let i = 0; i < batch.length; i++) {
          const { row, errs } = resolveRow({
            fmt: fmt.getInfo(),
            colIndex,
            rowData: batch[i],
            rowIdx: i + offset,
          });
          if (errs) {
            errors.push(...errs);
          }
          rows.push(row);
        }

        await this.persist.storeData(jobId, rows, errors);
        rows = [];
        errors = [];
        offset += batch.length;
      } while (batch.length === this.PROCESS_BZ);

      await Promise.all([
        this.persist.setAsDone(jobId),
        this.persist.deleteTmpData(jobId),
      ]);
    } catch (e) {
      throw e instanceof AppErr ? e : AppErr.unknown(e);
    }
  }

  async processDataError(e: unknown, data: string): Promise<void> {
    const setAsErr = this.persist.setAsError(data);

    const err = e instanceof AppErr ? e : AppErr.unknown(e);
    await Promise.all([
      setAsErr,
      this.persist.storeJobError(data, err.message),
    ]);
  }
}
