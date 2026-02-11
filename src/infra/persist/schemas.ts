import { Schema } from 'mongoose';
import {
  type CellError,
  type Row,
  type TableInfo,
  STATUS,
} from 'src/domain/entity';

export const JobSchema = new Schema<{ jobId: string; status: STATUS }>({
  jobId: { type: String, required: true, index: { unique: true } },
  status: { type: String, enum: Object.values(STATUS), required: true },
});

export const TmpDataSchema = new Schema<{ jobId: string; row: unknown[] }>({
  jobId: { type: String, required: true, index: true },
  row: { type: [Schema.Types.Mixed], default: [] },
});

export const InfoSchema = new Schema<TableInfo>({
  jobId: { type: String, required: true, index: { unique: true } },
  format: { type: String, required: true },
  cols: { type: [String], default: [] },
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
