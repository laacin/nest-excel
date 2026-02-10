export interface Row {
  num: number;
  data: unknown[];
}

export interface CellError {
  col: number;
  row: number;
}

export interface UnproccessData {
  jobId: string;
  format: string;
  cols: string[];
  rawRows: unknown[][];
  status: Status;
}

export interface FinalData {
  jobId: string;
  format: string;
  cols: string[];
  rows: Row[];
  errors?: CellError[];
}

export enum Status {
  Done,
  Processing,
  Pending,
}
