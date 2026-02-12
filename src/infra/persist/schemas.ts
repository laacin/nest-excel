import { Schema } from 'mongoose';
import {
  type CellError,
  type Row,
  type JobInfo,
  STATUS,
} from 'src/domain/entity';

export const JobSchema = new Schema<JobInfo & { columns: string[] }>({
  jobId: { type: String, required: true, index: { unique: true } },
  status: { type: String, enum: Object.values(STATUS), required: true },
  columns: { type: [String] },
  error: { type: String },
});

export const RowSchema = new Schema<Row & { jobId: string }>({
  jobId: { type: String, required: true, index: true },
  num: { type: Number, required: true },
  data: { type: [Schema.Types.Mixed], default: [] },
});

export const ErrSchema = new Schema<CellError & { jobId: string }>({
  jobId: { type: String, required: true, index: true },
  col: { type: Number, required: true },
  row: { type: Number, required: true },
});
