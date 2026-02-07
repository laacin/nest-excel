import { Injectable } from '@nestjs/common';
import { readFile, stream } from 'xlsx';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async readXlsx(
    fileName: string,
    batchSize: number,
    onBatch: (batch: Record<string, any>[]) => Promise<void>,
  ) {
    const wb = readFile(fileName);
    const sheet = wb.Sheets[wb.SheetNames[0]];

    const data = stream.to_json(sheet, { raw: true }) as AsyncIterable<
      Record<string, any>
    >;
    let batch: Record<string, any>[] = [];

    for await (const row of data) {
      batch.push(row);

      if (batch.length == batchSize) {
        await onBatch(batch);
        batch = [];
      }
    }
  }
}
