import type { CellErr, Job, JobAsProcess, JobAsDone, Row } from './entity';

export const PERSIST = 'PERSIST';
export interface PersistRepository {
  setAsPending(jobId: string): Promise<void>;
  setAsProcessing(jobId: string, updates: JobAsProcess): Promise<void>;
  setAsDone(jobId: string, updates: JobAsDone): Promise<void>;

  getJob(jobId: string): Promise<Job | undefined>;

  storeRows(jobId: string, rows: Row[]): Promise<void>;
  storeCellErrs(jobId: string, cellErrs: CellErr[]): Promise<void>;

  countRows(jobId: string): Promise<number>;
  countCellErrs(jobId: string): Promise<number>;

  getRows(jobId: string, sort: Sort): Promise<Row[]>;
  getCellErrs(jobId: string, sort: Sort): Promise<CellErr[]>;
}

export const MESSAGING = 'MESSAGING';
export interface MessagingService {
  storeQueue(queue: string): Promise<void>;
  storeConsumers(consumers: Consumer[]): Promise<void>;
  publish(queue: string, data: unknown): void;
}

// types
export interface Sort {
  limit: number;
  offset: number;
  desc?: boolean;
}

export interface Consumer {
  queue: string;
  work: (data: unknown) => Promise<void>;
  onErr?: {
    fallback?: (err: unknown, data: unknown) => Promise<void>;
    requeue?: boolean;
  };
}
