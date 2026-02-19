import { Schema } from 'mongoose';
import {
  type CellErr,
  Job,
  JobAsDone,
  JobAsError,
  JobAsPending,
  JobAsProcessing,
  type Row,
  STATUS,
} from '@domain/entity';

export interface JobPersist {
  jobId: string;
  status: STATUS;

  cols?: string[];
  totalRows?: number;
  rowCount?: number;
  cellErrCount?: number;

  finishedAt?: Date;
  reason?: string;
}

export const mapJob = ({ jobId, status, ...rest }: JobPersist): Job => {
  switch (status) {
    case STATUS.PENDING:
      return { jobId, status } satisfies JobAsPending;

    case STATUS.PROCESSING:
      return {
        jobId,
        status,
        cols: rest.cols!,
        totalRows: rest.totalRows!,
        rowCount: rest.rowCount!,
        cellErrCount: rest.cellErrCount!,
      } satisfies JobAsProcessing;

    case STATUS.DONE:
      return {
        jobId,
        status,
        cols: rest.cols!,
        rowCount: rest.rowCount!,
        cellErrCount: rest.cellErrCount!,
        finishedAt: rest.finishedAt!,
      } satisfies JobAsDone;

    case STATUS.ERROR:
      return {
        jobId,
        status,
        reason: rest.reason!,
        finishedAt: rest.finishedAt!,
      } satisfies JobAsError;
  }
};

export const JobSchema = new Schema<JobPersist>({
  jobId: { type: String, required: true, index: { unique: true } },
  status: { type: String, enum: Object.values(STATUS), required: true },
  cols: { type: [String], default: [] },
  totalRows: { type: Number, default: 0 },
  rowCount: { type: Number, default: 0 },
  cellErrCount: { type: Number, default: 0 },
  finishedAt: { type: Date },
  reason: { type: String },
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
