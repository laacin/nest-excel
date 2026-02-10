import { Inject, Injectable } from '@nestjs/common';
import { XlsxService } from './xlsx.service';
import { Format, resolveRow } from 'src/domain/format';
import { CellError, Row, Status } from 'src/domain/entity';
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
        await Promise.all([
          this.persist.storeJob({ jobId, format, cols: cols as string[] }),
          this.persist.addRowsToJob(jobId, rows),
        ]);
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
    let batch: unknown[][] = [];
    do {
      batch = await this.persist.getJobData(jobId, QUEUE_BATCH_SIZE, offset);
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
    } while (batch.length === QUEUE_BATCH_SIZE);

    await Promise.all([
      this.persist.setAsDone(jobId),
      this.persist.deleteTmpData(jobId),
    ]);
  }
}
