import { Injectable } from '@nestjs/common';
import { readFile, stream } from 'xlsx';

@Injectable()
export class AppService {
  async readXlsx(
    fileName: string,
    batchSize: number,
    onBatch: (batch: Record<string, unknown>[]) => Promise<void>,
  ) {
    const wb = readFile(fileName);
    const sheet = wb.Sheets[wb.SheetNames[0]];

    const data = stream.to_json(sheet, { raw: true }) as AsyncIterable<
      Record<string, unknown>
    >;
    let batch: Record<string, unknown>[] = [];

    for await (const row of data) {
      batch.push(row);

      if (batch.length == batchSize) {
        await onBatch(batch);
        batch = [];
      }
    }
  }
}
