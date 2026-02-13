import { CellError, Data, JobInfo, Row, STATUS } from 'src/domain/entity';
import { connect, model, Model, Mongoose } from 'mongoose';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PersistRepository, Sort } from 'src/domain/repository';
import { JobSchema, RowSchema, ErrSchema } from './schemas';
import { MONGO_URL } from '../config';

@Injectable()
export class MongoConn
  implements PersistRepository, OnModuleInit, OnModuleDestroy
{
  private conn: Mongoose;
  private job: Model<JobInfo & { columns: string[] }>;
  private row: Model<Row & { jobId: string }>;
  private err: Model<CellError & { jobId: string }>;

  constructor(@Inject(MONGO_URL) private readonly url: string) {}

  // Init nestjs methods
  async onModuleInit() {
    const conn = await connect(this.url);
    const job = model('job', JobSchema);
    const row = model('row', RowSchema);
    const err = model('err', ErrSchema);

    this.conn = conn;
    this.job = job;
    this.row = row;
    this.err = err;
  }

  async onModuleDestroy() {
    await this.conn.disconnect();
  }

  // PersistLayer methods
  async storeJob(jobId: string): Promise<void> {
    await this.job.create({ jobId, status: STATUS.PENDING });
  }

  async getJob(jobId: string): Promise<JobInfo | undefined> {
    const r = await this.job.findOne({ jobId }).lean();
    if (!r) return;

    return {
      jobId: r.jobId,
      status: r.status,
      error: r.error,
    };
  }

  async setAsProcessing(jobId: string): Promise<void> {
    await this.job.updateOne(
      { jobId },
      { $set: { status: STATUS.PROCESSING } },
    );
  }

  async setAsDone(jobId: string): Promise<void> {
    await this.job.updateOne({ jobId }, { $set: { status: STATUS.DONE } });
  }

  async setAsError(jobId: string, reason?: string): Promise<void> {
    const rs = reason ? reason : 'unknown reason';
    await this.job.updateOne(
      { jobId },
      { $set: { status: STATUS.ERROR, error: rs } },
    );
  }

  async storeData(
    jobId: string,
    data: Partial<Data>,
    exists?: boolean,
  ): Promise<void> {
    const promises: Promise<unknown>[] = [];

    if (!exists && data.columns?.length) {
      promises.push(
        this.job.updateOne({ jobId }, { $set: { columns: data.columns } }),
      );
    }

    // NOTE: unordered sacrifices atomicity to improve performance
    if (data.rows?.length) {
      promises.push(
        this.row.insertMany(
          data.rows.map(({ num, data }) => ({ jobId, num, data })),
          { ordered: false },
        ),
      );
    }

    if (data.errors?.length) {
      promises.push(
        this.err.insertMany(
          data.errors.map(({ col, row }) => ({ jobId, col, row })),
          { ordered: false },
        ),
      );
    }

    await Promise.all(promises);
  }

  async getRows(
    jobId: string,
    { limit, offset, desc }: Sort,
    mapped?: boolean,
  ): Promise<unknown[] | undefined> {
    const ord = desc ? -1 : 1;

    const [info, result] = await Promise.all([
      this.job.findOne({ jobId }, { columns: true }).lean(),
      this.row
        .find({ jobId }, { jobId: false })
        .sort({ num: ord })
        .skip(offset)
        .limit(limit)
        .lean(),
    ]);
    if (!info?.columns.length) return;

    return result.map(({ data }) =>
      mapped
        ? Object.fromEntries(data.map((v, i) => [info.columns[i], v]))
        : data,
    );
  }

  async getErrors(
    jobId: string,
    { limit, offset, desc }: Sort,
  ): Promise<CellError[] | undefined> {
    const ord = desc ? -1 : 1;

    const errs = await this.err
      .find({ jobId }, { jobId: false })
      .sort({ row: ord, col: ord })
      .skip(offset)
      .limit(limit)
      .lean();
    if (!errs) return;

    return errs.map(({ row, col }) => ({ row, col }));
  }
}
