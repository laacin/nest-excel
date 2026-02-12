export interface Row {
  num: number;
  data: unknown[];
}

export interface CellError {
  col: number;
  row: number;
}

export interface TableInfo {
  jobId: string;
  error?: string;
  format: string;
  cols: string[];
}

export interface Data {
  tableInfo: TableInfo;
  rows: Row[];
  errors: CellError[];
}

export enum STATUS {
  DONE = 'done',
  PROCESSING = 'processing',
  PENDING = 'pending',
  ERROR = 'error',
}
