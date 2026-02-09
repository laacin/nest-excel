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

  async uploadTest(
    fileName: string,
    format: Format,
  ): Promise<{
    id: string;
    valids: Record<string, unknown>[];
    errors?: RowError[];
  }> {
    const id = crypto.randomUUID();
    const valids: Record<string, unknown>[] = [];
    const errors: RowError[] = [];

    await this.XLSX.stream(fileName, 100, (batch, offset) => {
      for (let i = 0; i < batch.length; i++) {
        const rowData = batch[i];
        const [vals, errs] = resolveRow(format, {
          index: i + offset,
          data: rowData,
        });
        if (errs) {
          errors.push(...errs);
        }
        valids.push(vals.data);
      }
    });

    return { id, valids, errors };
  }
}
