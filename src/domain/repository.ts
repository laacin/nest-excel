import { Data, Status, TableInfo, Row, CellError } from './entity';

export const PERSIST = 'PERSIST';
export interface PersistLayer {
  storeJob(info: TableInfo): Promise<void>;
  addRowsToJob(jobId: string, rows: unknown[][]): Promise<void>; // <- job must exists

  getJobStatus(jobId: string): Promise<Status>;
  setAsProcessing(jobId: string): Promise<void>;
  setAsDone(jobId: string): Promise<void>;

  getJobInfo(jobId: string): Promise<TableInfo>;
  getJobData(
    jobId: string,
    limit: number,
    offset: number,
  ): Promise<unknown[][]>;
  deleteTmpData(jobId: string): Promise<void>;

  storeData(jobId: string, rows?: Row[], errs?: CellError[]): Promise<void>;
  getData(jobId: string, filter: DataFilter): Promise<Partial<Data>>;
}

// export const QUEUE = 'QUEUE';
// export interface QueueService {
//   send(data: Record<string, unknown>[]): void;
//   // sendOnBatches(callback: (data: OnConsumeOnBatches) => Promise<void>): void;
// }

export type DataFilter = {
  [K in keyof Data]?: K extends 'rows' | 'errors'
    ? { limit: number; offset: number }
    : boolean;
};
