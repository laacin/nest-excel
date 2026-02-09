import { DynSchema, Row, RowError, Status } from 'src/domain/entity';
import { connect, model, Model, Mongoose, Schema } from 'mongoose';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PersistLayer } from 'src/domain/repository';

const mongoSchema = new Schema<DynSchema>({
  id: { type: String, required: true, unique: true },
  status: { type: Number, required: true },
  rows: { type: Object },
  errors: { type: Object },
});

@Injectable()
export class MongoConn implements PersistLayer, OnModuleInit, OnModuleDestroy {
  private job: Model<DynSchema>;
  private conn: Mongoose;

  async onModuleInit() {
    const conn = await connect(
      process.env.MONGO_URL ?? 'mongodb://localhost:27017/mydb',
    );
    const job = model('job', mongoSchema);

    this.conn = conn;
    this.job = job;
  }

  async onModuleDestroy() {
    await this.conn.disconnect();
  }

  async setOnQueue(id: string): Promise<void> {
    await this.job.insertOne({
      id,
      status: Status.Pending,
    });
  }

  async checkStatus(id: string): Promise<Status | undefined> {
    const result = await this.job
      .findOne({ id }, { status: true, _id: false })
      .lean();
    return result?.status;
  }

  async persist(id: string, rows: Row[], errs?: RowError[]): Promise<void> {
    await this.job.updateOne(
      { id },
      {
        rows,
        errors: errs,
        status: errs ? Status.Error : Status.Success,
      },
    );
  }
}
