import { Injectable } from '@nestjs/common';
import { readFile, stream, utils } from 'xlsx';

@Injectable()
export class XlsxService {
  async stream(
    filename: string,
    batchSize: number,
    onBatch: (batch: unknown[][]) => Promise<void>,
  ) {
    const wb = readFile(filename);
    const sheet = wb.Sheets[wb.SheetNames[0]];

    const data = stream.to_json(sheet, { header: 1 }) as AsyncIterable<
      unknown[][]
    >;
    let batch: unknown[][] = [];

    for await (const row of data) {
      batch.push(row);

      if (batch.length == batchSize) {
        await onBatch(batch);
        batch = [];
      }
    }
    if (batch.length) await onBatch(batch);
  }

  // unused
  read(filename: string): unknown[][] {
    const wb = readFile(filename);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return utils.sheet_to_json(sheet, {
      header: 1,
    });
  }
}
