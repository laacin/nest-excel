export interface Row {
  num: number;
  data: unknown[];
}

export interface RowError {
  col: number;
  row: number;
}

export interface DynSchema {
  id: string;
  status: Status;
  rows?: Row[];
  errors?: RowError[];
}

export enum Status {
  Success,
  Pending,
  Error,
}
