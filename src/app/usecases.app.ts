import { Inject, Injectable } from '@nestjs/common';
import { XlsxService } from './xlsx.service';
import { Format, resolveRow } from 'src/domain/format';
import { CellError, RawData, Row, Status } from 'src/domain/entity';
import { PERSIST } from 'src/domain/repository';
import type { PersistLayer } from 'src/domain/repository';

const XLSX_READ_BATCH_SIZE = 100;
const QUEUE_BATCH_SIZE = 100;

@Injectable()
export class XlsxUseCase {
  constructor(
    @Inject(PERSIST) private readonly persist: PersistLayer,
    // @Inject(QUEUE) private readonly msg: QueueService,
    private readonly XLSX: XlsxService,
  ) {}

  // TODO: handle errors
  async uploadFile(fileName: string, format: string): Promise<string> {
    let first = true;
    const jobId = crypto.randomUUID();

    await this.XLSX.stream(fileName, XLSX_READ_BATCH_SIZE, async (b) => {
      if (first) {
        const [cols, ...rows] = b;
        await this.persist.storeJob({
          jobId,
          format,
          cols: cols as string[],
          rows,
        });
        first = false;
      } else {
        await this.persist.addRowsToJob(jobId, b);
      }
    });

    return jobId;
  }

  async checkJobStatus(jobId: string): Promise<Status> {
    return await this.persist.getJobStatus(jobId);
  }

  async processData(jobId: string): Promise<void> {
    await this.persist.setAsProcessing(jobId);

    const jobInfo = await this.persist.getJobInfo(jobId);
    const fmt = new Format(jobInfo.format);
    const colIndex = fmt.getColIndex(jobInfo.cols);

    let offset = 0;
    let batch: Pick<RawData, 'rows'>;
    do {
      batch = await this.persist.getJobData(jobId, QUEUE_BATCH_SIZE, offset);
      if (!batch.rows) break;

      let rows: Row[] = [];
      let errors: CellError[] = [];

      for (let i = 0; i < batch.rows.length; i++) {
        const { row, errs } = resolveRow({
          fmt: fmt.getInfo(),
          colIndex,
          rowData: batch.rows[i],
          rowIdx: i + offset,
        });
        if (errs) {
          errors.push(...errs);
        }
        rows.push(row);
      }

      if (offset === 0) {
        await this.persist.storeData({
          jobId: jobInfo.jobId,
          format: jobInfo.format,
          cols: jobInfo.cols,
          rows,
          errors,
        });
      } else {
        await this.persist.addRowsToData(jobId, rows, errors);
      }

      rows = [];
      errors = [];
      offset += batch.rows.length;
    } while (batch.rows?.length === QUEUE_BATCH_SIZE);

    await this.persist.setAsDone(jobId);
  }
}
