import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ISheetConstructor } from './services/xlsx.service';
import { Format } from 'src/domain/format';
import { CellErr, Row, STATUS } from 'src/domain/entity';
import { PERSIST, MESSAGING } from 'src/domain/repository';
import type {
  PersistRepository,
  MessagingService,
  Sort,
} from 'src/domain/repository';
import { BATCH_SIZE, QUEUE_NAME, SHEET_CLASS } from './config.app';
import { AppErr, PersistErr, FileErr } from 'src/domain/errs';

interface QueueData {
  jobId: string;
  filename: string;
  formatString: string;
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
      which: 'cellErrs';
      page: number;
      take: number;
      desc?: boolean;
    };

@Injectable()
export class UseCase implements OnModuleInit {
  constructor(
    @Inject(PERSIST) private readonly persist: PersistRepository,
    @Inject(MESSAGING) private readonly msg: MessagingService,
    @Inject(BATCH_SIZE) private readonly BATCH_SIZE: number,
    @Inject(QUEUE_NAME) private readonly QUEUE_NAME: string,
    @Inject(SHEET_CLASS) private readonly sheet: ISheetConstructor,
  ) {}

  async onModuleInit() {
    await Promise.all([this.msg.storeQueue(this.QUEUE_NAME)]);
    await this.msg.storeConsumers([
      {
        queue: this.QUEUE_NAME,
        work: (data: QueueData) => this.processJob(data),
        onErr: { requeue: true },
      },
    ]);
  }

  async handleUploadFile(
    filename: string,
    formatString: string,
  ): Promise<{ jobId: string }> {
    try {
      if (!filename.endsWith('.xlsx')) throw FileErr.noXlsx();

      new Format(formatString); // validate format
      const jobId = crypto.randomUUID();

      await this.persist.setAsPending(jobId);
      this.msg.publish(this.QUEUE_NAME, { jobId, filename, formatString });

      return { jobId };
    } catch (err) {
      throw err instanceof AppErr ? err : AppErr.unknown(err);
    }
  }

  async handleStatusRequest(jobId: string): Promise<unknown> {
    try {
      const job = await this.persist.getJob(jobId);
      if (!job) throw PersistErr.jobNotFound();

      if (job.status === STATUS.PROCESSING) {
        const [rowCount, cellErrCount] = await Promise.all([
          this.persist.countRows(jobId),
          this.persist.countCellErrs(jobId),
        ]);

        job.rowsCount = rowCount;
        job.cellErrCount = cellErrCount;
      }

      return job;
    } catch (err) {
      throw err instanceof AppErr ? err : AppErr.unknown(err);
    }
  }

  async handleDataRequest(jobId: string, req: DataRequest): Promise<unknown> {
    try {
      const job = await this.persist.getJob(jobId);
      if (!job) throw PersistErr.jobNotFound();
      if (job.status !== STATUS.DONE) throw PersistErr.jobInProcess();

      const sort: Sort = {
        limit: req.take,
        offset: (Math.max(1, req.page) - 1) * req.take,
        desc: req.desc,
      };

      if (req.which === 'rows') {
        const rows = await this.persist.getRows(jobId, sort);

        if (req.mapped) {
          return rows.map(({ values }) =>
            Object.fromEntries(values.map((v, i) => [job.cols[i], v])),
          );
        }

        return rows;
      }

      if (req.which === 'cellErrs') {
        return await this.persist.getCellErrs(jobId, sort);
      }
    } catch (err) {
      throw err instanceof AppErr ? err : AppErr.unknown(err);
    }
  }

  // -- internal use cases;
  async processJob({
    jobId,
    filename,
    formatString,
  }: QueueData): Promise<void> {
    try {
      const promise = Promise.all([
        this.persist.countRows(jobId),
        this.persist.countCellErrs(jobId),
      ]);

      const sheet = new this.sheet(filename);
      const fmt = new Format(formatString, sheet.getRawCols());
      const totalRows = sheet.getTotalRows();
      const [rowsCount, cellErrCount] = await promise;

      await this.persist.setAsProcessing(jobId, {
        cols: fmt.getCols(),
        totalRows,
        rowsCount,
        cellErrCount,
      });

      let offset = rowsCount;
      while (offset < totalRows) {
        const rawRows = sheet.getRawRows(this.BATCH_SIZE, offset);
        if (rawRows.length === 0) {
          throw AppErr.internal('unexpected no raw rows');
        }

        const rows: Row[] = [];
        const cellErrs: CellErr[] = [];

        for (const rawRow of rawRows) {
          const resolved = fmt.resolveRawRow(rawRow);

          if (resolved.cellErrs) cellErrs.push(...resolved.cellErrs);
          rows.push(resolved.row);
        }

        const promises = [this.persist.storeRows(jobId, rows)];
        if (cellErrs.length) {
          promises.push(this.persist.storeCellErrs(jobId, cellErrs));
        }

        await Promise.all(promises);
        offset += rawRows.length;
      }

      const [rowsCountFinal, cellErrCountFinal] = await Promise.all([
        this.persist.countRows(jobId),
        this.persist.countCellErrs(jobId),
      ]);

      if (rowsCountFinal !== totalRows) {
        console.log(
          `mismatch totalRows: expected: ${totalRows}, have: ${rowsCount}`,
        );
      }

      await this.persist.setAsDone(jobId, {
        rowsCount: rowsCountFinal,
        cellErrCount: cellErrCountFinal,
      });
    } catch (err) {
      throw err instanceof AppErr ? err : AppErr.unknown(err);
    }
  }
}
