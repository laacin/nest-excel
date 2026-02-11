import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { XlsxService } from './xlsx.service';
import { Format, resolveRow } from 'src/domain/format';
import { CellError, Data, Row, Status } from 'src/domain/entity';
import { PERSIST, QUEUE } from 'src/domain/repository';
import type {
  DataFilter,
  PersistLayer,
  QueueService,
} from 'src/domain/repository';

const XLSX_READ_BATCH_SIZE = 100;
const QUEUE_BATCH_SIZE = 100;

const JOB_UPLOAD = 'xlsx.upload';
const JOB_PROCESS = 'xlsx.process';

// TODO: handle errors
@Injectable()
export class UseCase implements OnModuleInit {
  constructor(
    @Inject(PERSIST) private readonly persist: PersistLayer,
    @Inject(QUEUE) private readonly msg: QueueService,
    private readonly XLSX: XlsxService,
  ) {}

  async onModuleInit() {
    await Promise.all([
      this.msg.newJob(JOB_UPLOAD),
      this.msg.newJob(JOB_PROCESS),
    ]);

    const uploadConsumer = this.msg.consumer('xlsx.upload', async (data) => {
      const { jobId, filename, format } = JSON.parse(data) as Record<
        string,
        string
      >;
      await this.uploadFile(jobId, filename, format);
    });

    const procConsumer = this.msg.consumer('xlsx.process', async (data) => {
      await this.processData(data);
    });

    await Promise.all([uploadConsumer, procConsumer]);
  }

  // -- Handlers
  async handleUploadReq(filename: string, format: string): Promise<string> {
    if (!filename.endsWith('.xlsx')) throw new Error('file must be .xlsx');
    new Format(format);

    const jobId = crypto.randomUUID();

    await this.persist.setAsPending(jobId);
    this.msg.publish(JOB_UPLOAD, JSON.stringify({ jobId, filename, format }));

    return jobId;
  }

  async handleStatusReq(jobId: string): Promise<Status> {
    return await this.persist.getJobStatus(jobId);
  }

  async handleResultReq(
    jobId: string,
    filter: DataFilter,
  ): Promise<Partial<Data>> {
    return await this.persist.getData(jobId, filter);
  }

  // -- internal use cases;
  async uploadFile(
    jobId: string,
    fileName: string,
    format: string,
  ): Promise<void> {
    let first = true;
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

    this.msg.publish(JOB_PROCESS, jobId);
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
