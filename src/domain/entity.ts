export interface Row {
  num: number;
  data: unknown[];
}

export interface CellError {
  col: number;
  row: number;
}

export interface RawData {
  jobId: string;
  format: string;
  cols: string[];
  rows?: unknown[][];
}

export interface Data {
  jobId: string;
  format: string;
  cols: string[];
  rows: Row[];
  errors?: CellError[];
}

export enum Status {
  Done = 'done',
  Processing = 'processing',
  Pending = 'pending',
}
