import { CellError, Data, JobInfo } from './entity';

export const PERSIST = 'PERSIST';
export interface PersistRepository {
  storeJob(jobId: string): Promise<void>;
  getJob(jobId: string): Promise<JobInfo | undefined>;

  setAsProcessing(jobId: string): Promise<void>;
  setAsDone(jobId: string): Promise<void>;
  setAsError(jobId: string, reason?: string): Promise<void>;

  storeData(
    jobId: string,
    data: Partial<Data>,
    exists?: boolean,
  ): Promise<void>;

  getRows(
    jobId: string,
    limit: number,
    offset: number,
    mapped?: boolean,
  ): Promise<unknown[] | undefined>;
  getErrors(
    jobId: string,
    limit: number,
    offset: number,
  ): Promise<CellError[] | undefined>;
}

export const QUEUE = 'QUEUE';
export interface QueueService<T> {
  newJob(job: string): Promise<void>;
  publish(job: string, data: T): void;
  consumer(
    job: string,
    work: (data: T) => Promise<void>,
    onErr?: OnConsumerErr<T>,
  ): Promise<void>;
}

export interface OnConsumerErr<T> {
  requeue?: boolean;
  fallback?: (e: unknown, data: T) => Promise<void>;
}
