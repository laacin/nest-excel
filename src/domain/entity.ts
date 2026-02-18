export interface Job {
  jobId: string;
  status: STATUS;
  cols: string[];
  totalRows: number;
  rowCount: number;
  cellErrCount: number;
}

export type JobAsProcess = Omit<Job, 'jobId' | 'status'>;
export type JobAsDone = Omit<Job, 'jobId' | 'status' | 'cols' | 'totalRows'>;

export enum STATUS {
  DONE = 'done',
  PROCESSING = 'processing',
  PENDING = 'pending',
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
