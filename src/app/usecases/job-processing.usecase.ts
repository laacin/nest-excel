import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Format } from '@domain/format';
import { CellErr, Row, STATUS } from '@domain/entity';
import type { ISheetConstructor } from '@app/services/xlsx.service';
import type { PersistRepository, MessagingService } from '@domain/repository';
import type { QueueNames } from '@app/config';
import { PERSIST, MESSAGING } from '@domain/repository';
import { BATCH_SIZE, QUEUE_NAMES, SHEET_CLASS } from '@app/constants';
import { AppErr, ERR_CODE, JobErr } from '@domain/errs';

// type definitions
interface PublishData {
  jobId: string;
  filename: string;
  formatString: string;
}

interface UploadFileParams {
  filename: string;
  formatString: string;
}

interface GetStatusParams {
  jobId: string;
}

interface GetJobQueryParams {
  jobId: string;
  limit: number;
  offset: number;
  desc: boolean;
}

@Injectable()
export class JobProcessingUseCase implements OnModuleInit {
  constructor(
    @Inject(PERSIST) private readonly persist: PersistRepository,
    @Inject(MESSAGING) private readonly msg: MessagingService,
    @Inject(BATCH_SIZE) private readonly batchSize: number,
    @Inject(QUEUE_NAMES) private readonly queueNames: QueueNames,
    @Inject(SHEET_CLASS) private readonly sheet: ISheetConstructor,
  ) {}

  async onModuleInit() {
    await Promise.all([this.msg.storeQueue(this.queueNames.process)]);
    await this.msg.storeConsumers([
      {
        queue: this.queueNames.process,
        work: (data: PublishData) => this.processJob(data),
        onErr: {
          fallback: (err, data: PublishData) => this.processFails(err, data),
          requeue: true,
        },
      },
    ]);
  }

  async uploadFile({
    filename,
    formatString,
  }: UploadFileParams): Promise<{ jobId: string }> {
    try {
      new Format(formatString); // validate format
      const jobId = crypto.randomUUID();

      await this.persist.setAsPending({ jobId, status: STATUS.PENDING });
      this.msg.publish(this.queueNames.process, {
        jobId,
        filename,
        formatString,
      } satisfies PublishData);

      return { jobId };
    } catch (err) {
      throw err instanceof AppErr ? err : AppErr.unknown(err);
    }
  }

  async getStatus({ jobId }: GetStatusParams): Promise<unknown> {
    try {
      const job = await this.persist.getJob(jobId);
      if (!job) throw JobErr.notFound();

      if (job.status === STATUS.PROCESSING) {
        const [rowCount, cellErrCount] = await Promise.all([
          this.persist.countRows(jobId),
          this.persist.countCellErrs(jobId),
        ]);

        job.rowCount = rowCount;
        job.cellErrCount = cellErrCount;
      }

      return job;
    } catch (err) {
      throw err instanceof AppErr ? err : AppErr.unknown(err);
    }
  }

  async getRows({ jobId, ...sort }: GetJobQueryParams): Promise<unknown> {
    try {
      const job = await this.persist.getJob(jobId);
      if (!job) throw JobErr.notFound();
      if (job.status === STATUS.PENDING || job.status === STATUS.ERROR) {
        throw JobErr.unavailable();
      }

      const rows = await this.persist.getRows(jobId, sort);
      return rows.map(({ values }) =>
        Object.fromEntries(values.map((v, i) => [job.cols[i], v])),
      );
    } catch (err) {
      throw err instanceof AppErr ? err : AppErr.unknown(err);
    }
  }

  async getCellErrs({ jobId, ...sort }: GetJobQueryParams): Promise<unknown> {
    try {
      const job = await this.persist.getJob(jobId);
      if (!job) throw JobErr.notFound();

      return await this.persist.getCellErrs(jobId, sort);
    } catch (err) {
      throw err instanceof AppErr ? err : AppErr.unknown(err);
    }
  }

  // internal use cases
  private async processJob({
    jobId,
    filename,
    formatString,
  }: PublishData): Promise<void> {
    try {
      const initialCountsPromise = Promise.all([
        this.persist.countRows(jobId),
        this.persist.countCellErrs(jobId),
      ]);

      const sheet = new this.sheet(filename);
      const fmt = new Format(formatString, sheet.getRawCols());
      const totalRows = sheet.getTotalRows();
      const [rowCount, cellErrCount] = await initialCountsPromise;

      await this.persist.setAsProcessing({
        jobId,
        status: STATUS.PROCESSING,
        cols: fmt.getCols(),
        totalRows,
        rowCount,
        cellErrCount,
      });

      let offset = rowCount;
      while (offset < totalRows) {
        const rawRows = sheet.getRawRows(this.batchSize, offset);
        if (rawRows.length === 0) {
          throw AppErr.internal('no raw rows returned unexpectedly');
        }

        const rows: Row[] = [];
        const cellErrs: CellErr[] = [];

        for (const rawRow of rawRows) {
          const resolved = fmt.resolveRawRow(rawRow);

          if (resolved.cellErrs) cellErrs.push(...resolved.cellErrs);
          rows.push(resolved.row);
        }

        const storePromises = [this.persist.storeRows(jobId, rows)];
        if (cellErrs.length) {
          storePromises.push(this.persist.storeCellErrs(jobId, cellErrs));
        }

        await Promise.all(storePromises);
        offset += rawRows.length;
      }

      const [rowCountFinal, cellErrCountFinal] = await Promise.all([
        this.persist.countRows(jobId),
        this.persist.countCellErrs(jobId),
      ]);

      if (rowCountFinal !== totalRows) {
        throw AppErr.internal(
          `mismatch totalRows: expected ${totalRows}, got ${rowCountFinal}`,
        );
      }

      await this.persist.setAsDone({
        jobId,
        status: STATUS.DONE,
        cols: fmt.getCols(),
        rowCount: rowCountFinal,
        cellErrCount: cellErrCountFinal,
        finishedAt: new Date(),
      });
    } catch (err) {
      throw err instanceof AppErr ? err : AppErr.unknown(err);
    }
  }

  private async processFails(
    err: unknown,
    { jobId }: PublishData,
  ): Promise<void> {
    try {
      const appErr = err instanceof AppErr ? err : AppErr.unknown(err);
      if (appErr.code === ERR_CODE.UNKNOWN) {
        throw err; // requeue
      }

      await this.persist.setAsError({
        jobId,
        status: STATUS.ERROR,
        reason: appErr.message,
        finishedAt: new Date(),
      });
    } catch (err) {
      throw err instanceof AppErr ? err : AppErr.unknown(err);
    }
  }
}
