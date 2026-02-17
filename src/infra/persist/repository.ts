import {
  CellErr,
  Job,
  JobAsDone,
  JobAsProcess,
  Row,
  STATUS,
} from 'src/domain/entity';
import { connect, model, Model, Mongoose } from 'mongoose';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PersistRepository, Sort } from 'src/domain/repository';
import { JobSchema, RowSchema, CellErrSchema } from './schemas';

@Injectable()
export class MongoImpl implements PersistRepository, OnModuleDestroy {
  private conn: Mongoose;
  private job: Model<Job>;
  private row: Model<Row & { jobId: string }>;
  private cellErr: Model<CellErr & { jobId: string }>;

  async onModuleDestroy() {
    await this.conn.disconnect();
  }

  async connect(url: string): Promise<void> {
    const conn = await connect(url, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
      socketTimeoutMS: 2000,
    });

    const job = model('job', JobSchema);
    const row = model('row', RowSchema);
    const cellErr = model('cellErr', CellErrSchema);

    this.conn = conn;
    this.job = job;
    this.row = row;
    this.cellErr = cellErr;
  }

  setup({
    onConnect,
    onDisconnect,
  }: {
    onConnect?: () => void;
    onDisconnect?: () => void;
  }): void {
    if (onConnect) this.conn.connection.on('connected', onConnect);
    if (onDisconnect) this.conn.connection.on('disconnected', onDisconnect);
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.conn.connection.db?.admin().ping();
      return true;
    } catch {
      return false;
    }
  }

  // PersistRepository methods
  async setAsPending(jobId: string): Promise<void> {
    await this.job.create({ jobId, status: STATUS.PENDING });
  }

  async setAsProcessing(jobId: string, updates: JobAsProcess): Promise<void> {
    await this.job.updateOne(
      { jobId },
      { $set: { status: STATUS.PROCESSING, ...updates } },
    );
  }

  async setAsDone(jobId: string, updates: JobAsDone): Promise<void> {
    await this.job.updateOne(
      { jobId },
      { $set: { status: STATUS.DONE, ...updates } },
    );
  }

  async getJob(jobId: string): Promise<Job | undefined> {
    const job = await this.job
      .findOne({ jobId }, { _id: false, __v: false, jobId: false })
      .lean();
    if (!job) return;
    return { ...job };
  }

  async storeRows(jobId: string, rows: Row[]): Promise<void> {
    await this.row.insertMany(
      rows.map(({ num, values }) => ({ jobId, num, values })),
      { ordered: false },
    );
  }

  async storeCellErrs(jobId: string, cellErrs: CellErr[]): Promise<void> {
    await this.cellErr.insertMany(
      cellErrs.map(({ col, row }) => ({ jobId, col, row })),
      { ordered: false },
    );
  }

  async countRows(jobId: string): Promise<number> {
    return await this.row.countDocuments({ jobId });
  }

  async countCellErrs(jobId: string): Promise<number> {
    return await this.cellErr.countDocuments({ jobId });
  }

  async getRows(jobId: string, sort: Sort): Promise<Row[]> {
    const ord = sort.desc ? -1 : 1;

    const rows = await this.row
      .find({ jobId }, { _id: false, __v: false, jobId: false })
      .sort({ num: ord })
      .limit(sort.limit)
      .skip(sort.offset)
      .lean();

    return rows as Row[];
  }

  async getCellErrs(jobId: string, sort: Sort): Promise<CellErr[]> {
    const ord = sort.desc ? -1 : 1;

    const cellErrs = await this.cellErr
      .find({ jobId }, { _id: false, __v: false, jobId: false })
      .sort({ row: ord })
      .limit(sort.limit)
      .skip(sort.offset)
      .lean();

    return cellErrs as CellErr[];
  }
}
