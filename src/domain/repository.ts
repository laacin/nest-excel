import { Row, RowError, Status } from './entity';

export const PERSIST = 'PERSIST';
export interface PersistLayer {
  setOnQueue(id: string): Promise<void>;
  checkStatus(id: string): Promise<Status | undefined>;
  persist(id: string, rows: Row[], errs?: RowError[]): Promise<void>;
}

export const QUEUE = 'QUEUE';
export interface QueueService {
  send(data: Record<string, unknown>[]): void;
  // sendOnBatches(callback: (data: OnConsumeOnBatches) => Promise<void>): void;
}

// interface OnConsumeOnBatches {
//   batch: Record<string, unknown>[];
//   batchSize: number;
//   chunk: number;
//   last_chunk: boolean;
// }
