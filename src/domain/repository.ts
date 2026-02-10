import { Data, Status, RawData, Row, CellError } from './entity';

export const PERSIST = 'PERSIST';
export interface PersistLayer {
  storeJob(data: RawData): Promise<void>;
  addRowsToJob(jobId: string, rows: unknown[][]): Promise<void>; // <- job must exists

  getJobStatus(jobId: string): Promise<Status>;
  setAsProcessing(jobId: string): Promise<void>;
  setAsDone(jobId: string): Promise<void>;

  getJobInfo(jobId: string): Promise<Omit<RawData, 'rows'>>;
  getJobData(
    jobId: string,
    limit: number,
    offset: number,
  ): Promise<Pick<RawData, 'rows'>>;
  deleteTmpData(jobId: string): Promise<void>;

  storeData(data: Data): Promise<void>;
  addRowsToData(jobId: string, rows: Row[], errs?: CellError[]): Promise<void>;
  getData(jobId: string): Promise<Data>;
}

// export const QUEUE = 'QUEUE';
// export interface QueueService {
//   send(data: Record<string, unknown>[]): void;
//   // sendOnBatches(callback: (data: OnConsumeOnBatches) => Promise<void>): void;
// }
