import { ISheet } from 'src/app/services/xlsx.service';
import { RawRow } from 'src/domain/entity';

export class SheetMock implements ISheet {
  private range: number;
  private header: unknown[];
  private data: unknown[][];

  constructor(filename: string) {
    const cleanName = filename.replace(/^[^-]+-/, '');

    const sheet = mockSheets.get(cleanName);
    if (!sheet) throw new Error('no sheet');

    this.range = sheet.length - 1;
    this.header = sheet[0];
    this.data = sheet.slice(1);
  }

  getTotalRows(): number {
    return this.range;
  }

  getRawCols(): unknown[] {
    return this.header;
  }

  getRawRows(limit: number, offset: number): RawRow[] {
    const result = this.data.slice(offset, offset + limit);
    return result.map((v, i) => ({ index: i + offset, values: v }));
  }
}

export const mockSheets = new Map<string, unknown[][]>([
  [
    'valid.xlsx',
    [
      ['name', 'age', 'extra', 'nums'],
      ['name1', '53', 'extra1', '1,4,2,5'],
      ['name2', '32', 'extra1', '1,4,2,5'],
    ],
  ],
  [
    'invalid_missing_cols.xlsx',
    [
      ['name', 'nums'],
      ['name3', '1,2,3'],
      ['name4', '4,5,6'],
    ],
  ],
  [
    'invalid_types.xlsx',
    [
      ['name', 'age', 'nums'],
      ['name5', 'not_a_number', '1,2'],
      ['name6', '42', 'a,b,c'],
    ],
  ],
  [
    'extra_columns.xlsx',
    [
      ['name', 'age', 'nums', 'extra1', 'extra2'],
      ['name7', '21', '1,2,3', 'foo', 'bar'],
      ['name8', '35', '4,5,6', 'baz', 'qux'],
    ],
  ],
  [
    'empty_rows.xlsx',
    [
      ['name', 'age', 'nums'],
      ['', '', ''],
      ['name9', '40', '7,8,9'],
      ['', '', ''],
    ],
  ],
]);
