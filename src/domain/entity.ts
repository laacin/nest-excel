export interface Row {
  index: number;
  data: Record<string, unknown>;
}

export interface RowError {
  col: number;
  row: number;
  reason: 'invalid' | 'missing';
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
