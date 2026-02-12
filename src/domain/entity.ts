export interface JobInfo {
  jobId: string;
  status: STATUS;
  error?: string;
}

export interface Data {
  columns: string[];
  rows: Row[];
  errors: CellError[];
}

// nested
export enum STATUS {
  DONE = 'done',
  PROCESSING = 'processing',
  PENDING = 'pending',
  ERROR = 'error',
}

export interface Row {
  num: number;
  data: unknown[];
}

export interface CellError {
  col: number;
  row: number;
}
