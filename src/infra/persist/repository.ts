import { CellError, Data, Row, Status, TableInfo } from 'src/domain/entity';
import { connect, model, Model, Mongoose } from 'mongoose';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataFilter, PersistLayer } from 'src/domain/repository';
import {
  JobSchema,
  TmpDataSchema,
  InfoSchema,
  RowSchema,
  ErrSchema,
} from './schemas';

@Injectable()
export class MongoConn implements PersistLayer, OnModuleInit, OnModuleDestroy {
  private conn: Mongoose;
  private job: Model<{ jobId: string; status: Status }>;
  private info: Model<TableInfo>;
  private tmp: Model<{ jobId: string; row: unknown[] }>;
  private row: Model<Row & { jobId: string }>;
  private err: Model<CellError & { jobId: string }>;

  // Init nestjs methods
  async onModuleInit() {
    const conn = await connect(
      process.env.MONGO_URL ?? 'mongodb://localhost:27017/mydb',
    );
    const job = model('job', JobSchema);
    const info = model('info', InfoSchema);
    const tmp = model('tmp', TmpDataSchema);
    const row = model('row', RowSchema);
    const err = model('err', ErrSchema);

    this.conn = conn;
    this.job = job;
    this.info = info;
    this.tmp = tmp;
    this.row = row;
    this.err = err;
  }

  async onModuleDestroy() {
    await this.conn.disconnect();
  }

  // PersistLayer methods
  // TODO: handle errors
  async storeJob(info: TableInfo): Promise<void> {
    await Promise.all([
      this.job.insertOne({ jobId: info.jobId, status: Status.Pending }),
      this.info.insertOne({ ...info }),
    ]);
  }

  async addRowsToJob(jobId: string, rows: unknown[][]): Promise<void> {
    await this.tmp.insertMany(
      rows.map((row) => {
        return { jobId, row };
      }),
    );
  }

  async getJobStatus(jobId: string): Promise<Status> {
    const s = await this.job.findOne({ jobId }).lean();
    if (!s) throw new Error("job doesn't exists");
    return s.status;
  }

  async setAsProcessing(jobId: string): Promise<void> {
    await this.job.updateOne({ jobId }, { status: Status.Processing });
  }

  async setAsDone(jobId: string): Promise<void> {
    await this.job.updateOne({ jobId }, { status: Status.Done });
  }

  async getJobInfo(jobId: string): Promise<TableInfo> {
    const result = await this.info.findOne({ jobId }).lean();
    if (!result) throw new Error("job doesn't exists");

    return {
      jobId: result.jobId,
      format: result.format,
      cols: result.cols,
    };
  }

  async getJobData(
    jobId: string,
    limit: number,
    offset: number,
  ): Promise<unknown[][]> {
    const data = await this.tmp
      .find({ jobId }, { row: true })
      .sort({ _id: 1 })
      .skip(offset)
      .limit(limit)
      .lean();

    return data.length ? data.map((x) => x.row) : [];
  }

  async deleteTmpData(jobId: string): Promise<void> {
    await this.tmp.deleteMany({ jobId });
  }

  async storeData(
    jobId: string,
    rows?: Row[],
    errs?: CellError[],
  ): Promise<void> {
    if (!rows && !errs) return;

    const promises: Promise<unknown>[] = [];

    if (rows?.length) {
      promises.push(
        this.row.insertMany(
          rows.map(({ num, data }) => ({ jobId, num, data })),
        ),
      );
    }

    if (errs?.length) {
      promises.push(
        this.err.insertMany(errs.map(({ col, row }) => ({ jobId, col, row }))),
      );
    }

    await Promise.all(promises);
  }

  async getData(jobId: string, filter: DataFilter): Promise<Partial<Data>> {
    const result: Partial<Data> = {};

    if (filter.tableInfo) {
      const r = await this.info.findOne({ jobId }).lean();
      if (!r) throw new Error("job doesn't exists");
      result.tableInfo = {
        jobId: r.jobId,
        format: r.format,
        cols: r.cols,
      };
    }

    if (filter.rows) {
      const r = await this.row
        .find({ jobId }, { jobId: false })
        .skip(filter.rows.offset)
        .limit(filter.rows.limit)
        .lean();

      result.rows = r
        ? r.map(({ num, data }) => {
            return { num, data };
          })
        : [];
    }

    if (filter.errors) {
      const r = await this.err
        .find({ jobId }, { jobId: false })
        .skip(filter.errors.offset)
        .limit(filter.errors.limit);

      result.errors = r
        ? r.map(({ row, col }) => {
            return { row, col };
          })
        : [];
    }

    return result;
  }
}
