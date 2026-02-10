import { Inject, Injectable } from '@nestjs/common';
import { XlsxService } from './xlsx.service';
import { Format, resolveRow } from 'src/domain/format';
import { RowError, Status } from 'src/domain/entity';
import { QUEUE, PERSIST } from 'src/domain/repository';
import type { PersistLayer, QueueService } from 'src/domain/repository';

@Injectable()
export class XlsxUseCase {
  constructor(
    @Inject(PERSIST) private readonly PERSIST: PersistLayer,
    @Inject(QUEUE) private readonly MSG: QueueService,
    private readonly XLSX: XlsxService,
  ) {}

  async uploadXLSX(fileName: string): Promise<string> {
    const id = crypto.randomUUID();
    await this.PERSIST.setOnQueue(id);

    await this.XLSX.stream(fileName, 100, (b) => {
      this.MSG.send(b);
    });

    return id;
  }

  async checkStatus(id: string): Promise<Status> {
    const status = await this.PERSIST.checkStatus(id);
    if (status === undefined) return status!; // TODO: <- handle it;
    return status;
  }

  uploadTest(
    fileName: string,
    fmt: Format,
  ): {
    id: string;
    valids: unknown[];
    errors?: RowError[];
  } {
    const id = crypto.randomUUID();
    const valids: unknown[] = [];
    const errors: RowError[] = [];

    const [cols, rows] = this.XLSX.read(fileName);
    const colIndex = fmt.getColIndex(cols);

    for (let i = 0; i < rows.length; i++) {
      const { row, errs } = resolveRow({
        fmt: fmt.getInfo(),
        colIndex,
        rowData: rows[i],
        rowIdx: i,
      });
      if (errs) {
        errors.push(...errs);
      }
      valids.push(row.data);
    }

    return { id, valids, errors };
  }

  // getWithHeaders(file: string): XlsxResult {
  //   return this.XLSX.read(file);
  // }

  // async queueLogic({
  //   id,
  //   format,
  //   batch,
  //   chunk,
  // }: {
  //   id: string;
  //   format: Format;
  //   batch: Record<string, unknown>[];
  //   chunk: number;
  // }): Promise<void> {
  //   for (let i = 0; i < batch.length; i++) {
  //     const data = batch[i];
  //     const [row, errs] = resolveRow(format, { data, index: 1 });
  //   }
  // }
}
