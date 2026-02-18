import { RawRow } from '@domain/entity';
import XLSX from 'xlsx';

// abstraction
export type ISheetConstructor = new (filename: string) => ISheet;
export interface ISheet {
  getTotalRows(): number;
  getRawCols(): unknown[];
  getRawRows(limit: number, offset: number): RawRow[];
}

// impl
export class Sheet implements ISheet {
  private sheet: XLSX.WorkSheet;
  private range: XLSX.Range;

  constructor(filename: string) {
    const wb = XLSX.readFile(filename);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    this.range = XLSX.utils.decode_range(sheet['!ref']!);
    this.sheet = sheet;
  }

  getTotalRows(): number {
    return this.range.e.r;
  }

  getRawCols(): unknown[] {
    const rawCols = XLSX.utils.sheet_to_json(this.sheet, {
      header: 1,
      range: 0,
    })[0] as unknown[];

    return rawCols;
  }

  getRawRows(limit: number, offset: number): RawRow[] {
    const start = offset + 1;
    const end = Math.min(limit + start - 1, this.range.e.r);

    const result: unknown[][] = XLSX.utils.sheet_to_json(this.sheet, {
      header: 1,
      range: { s: { r: start, c: 0 }, e: { r: end, c: this.range.e.c } },
    });

    return result.map(
      // RawRow index is 0-based, that's why i use 'i + offset' instead of 'i + start'
      (values, i) => ({ index: i + offset, values }) satisfies RawRow,
    );
  }
}
