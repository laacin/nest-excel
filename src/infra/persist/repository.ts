import { CellError, Data, JobInfo, Row, STATUS } from 'src/domain/entity';
import { connect, model, Model, Mongoose } from 'mongoose';
import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { DataFilter, PersistRepository } from 'src/domain/repository';
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

  async getData(
    jobId: string,
    filter: DataFilter,
  ): Promise<Partial<Data & JobInfo> | undefined> {
    const [info, rows, errors] = await Promise.all([
      this.job.findOne({ jobId }).lean(),

      filter.rows
        ? this.row
            .find({ jobId }, { jobId: false })
            .skip(filter.rows.offset)
            .limit(filter.rows.limit)
            .lean()
        : null,

      filter.errors
        ? this.err
            .find({ jobId }, { jobId: false })
            .skip(filter.errors.offset)
            .limit(filter.errors.limit)
            .lean()
        : null,
    ]);

    if (!info) return;
    const result: Partial<Data & JobInfo> = {};

    result.rows = rows?.map(({ num, data }) => ({ num, data })) ?? [];
    result.errors = errors?.map(({ row, col }) => ({ row, col })) ?? [];

    Object.entries(filter).forEach(([key, has]) => {
      if (has && !['errors', 'rows', 'jobId'].includes(key)) {
        const value = info[key as keyof typeof info];
        result[key] = value;
      }
    });

    return result;
  }
}
