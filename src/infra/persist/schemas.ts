import { Schema } from 'mongoose';
import { type CellErr, type Row, type Job, STATUS } from 'src/domain/entity';

export const JobSchema = new Schema<Job>({
  jobId: { type: String, required: true, index: { unique: true } },
  status: { type: String, enum: Object.values(STATUS), required: true },
  cols: { type: [String], default: [] },
  totalRows: { type: Number, default: 0 },
  rowsCount: { type: Number, default: 0 },
  cellErrCount: { type: Number, default: 0 },
});

export const RowSchema = new Schema<Row & { jobId: string }>({
  jobId: { type: String, required: true, index: true },
  num: { type: Number, required: true },
  values: { type: [Schema.Types.Mixed], default: [] },
});

export const CellErrSchema = new Schema<CellErr & { jobId: string }>({
  jobId: { type: String, required: true, index: true },
  col: { type: Number, required: true },
  row: { type: Number, required: true },
});
