export type Job = JobAsPending | JobAsProcessing | JobAsDone | JobAsError;

export interface JobAsPending {
  jobId: string;
  status: STATUS.PENDING;
}

export interface JobAsProcessing {
  jobId: string;
  status: STATUS.PROCESSING;
  cols: string[];
  totalRows: number;
  rowCount: number;
  cellErrCount: number;
}

export interface JobAsDone {
  jobId: string;
  status: STATUS.DONE;
  cols: string[];
  totalRows: number;
  rowCount: number;
  cellErrCount: number;
  finishedAt: Date;
}

export interface JobAsError {
  jobId: string;
  status: STATUS.ERROR;
  reason: string;
  finishedAt: Date;
}

export enum STATUS {
  DONE = 'done',
  PROCESSING = 'processing',
  PENDING = 'pending',
  ERROR = 'error',
}

export interface RawRow {
  index: number;
  values: unknown[];
}

export interface Row {
  num: number;
  values: unknown[];
}

export interface CellErr {
  col: number;
  row: number;
}
