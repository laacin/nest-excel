import { Data, STATUS, TableInfo, Row, CellError } from './entity';

export const PERSIST = 'PERSIST';
export interface PersistLayer {
  storeJob(info: TableInfo): Promise<void>;
  addRowsToJob(jobId: string, rows: unknown[][]): Promise<void>; // <- job must exists

  getJobStatus(jobId: string): Promise<STATUS | undefined>;
  setAsPending(jobId: string): Promise<void>;
  setAsProcessing(jobId: string): Promise<void>;
  setAsError(jobId: string): Promise<void>;
  setAsDone(jobId: string): Promise<void>;

  storeJobError(jobId: string, error: string): Promise<void>;
  getJobInfo(jobId: string): Promise<TableInfo | undefined>;
  getJobData(
    jobId: string,
    limit: number,
    offset: number,
  ): Promise<unknown[][]>;
  deleteTmpData(jobId: string): Promise<void>;

  storeData(jobId: string, rows?: Row[], errs?: CellError[]): Promise<void>;
  getData(
    jobId: string,
    filter: DataFilter,
  ): Promise<Partial<Data> | undefined>;
}

export type DataFilter = {
  [K in keyof Data]?: K extends 'rows' | 'errors'
    ? { limit: number; offset: number }
    : boolean;
};

export const QUEUE = 'QUEUE';
export interface QueueService {
  newJob(job: string): Promise<void>;
  publish(job: string, data: string): void;
  consumer(
    job: string,
    work: (data: string) => Promise<void>,
    onErr?: OnConsumerErr<string>,
  ): Promise<void>;
}

export interface OnConsumerErr<T> {
  requeue?: boolean;
  fallback?: (e: unknown, data: T) => Promise<void>;
}
