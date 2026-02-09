import { Injectable } from '@nestjs/common';
import { readFile, stream, utils } from 'xlsx';

@Injectable()
export class XlsxService {
  async stream(
    fileName: string,
    batchSize: number,
    onBatch: (batch: Record<string, unknown>[], offset: number) => void,
  ) {
    const wb = readFile(fileName);
    const sheet = wb.Sheets[wb.SheetNames[0]];

    const data = stream.to_json(sheet) as AsyncIterable<
      Record<string, unknown>
    >;
    let batch: Record<string, unknown>[] = [];
    let offset = 0;

    for await (const row of data) {
      batch.push(row);

      if (batch.length == batchSize) {
        onBatch(batch, offset);
        offset += batch.length;
        batch = [];
      }
    }
  }

  read(fileName: string): Record<string, unknown>[] {
    const wb = readFile(fileName);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return utils.sheet_to_json(sheet);
  }
}
