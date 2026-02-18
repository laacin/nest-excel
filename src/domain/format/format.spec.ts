import { FmtErr } from '@domain/errs';
import { Format } from '@domain/format';

const checkErr = (fn: () => void): string => {
  try {
    fn();
    return 'ok';
  } catch (err) {
    if (err instanceof Error) return err.message;
    return 'unknown error';
  }
};

describe('format', () => {
  it('validFormat', () => {
    const formatString = '{"name": "String"}';

    const res = checkErr(() => new Format(formatString));
    expect(res).toStrictEqual('ok');
  });

  it('invalidFormat', () => {
    const formatString = '{"name": }';

    const res = checkErr(() => new Format(formatString));
    expect(res).toStrictEqual(FmtErr.invalid().message);
  });

  it('cols', () => {
    const formatString = '{"name": "String", "age": "Number"}';
    const data: unknown[][] = [['name', 'extra', 'age']];

    const fmt = new Format(formatString, data[0]);
    const cols = fmt.getCols();

    expect(cols).toStrictEqual(['name', 'age']);
  });

  it('resolveRawRow', () => {
    const formatString = '{"name": "String", "age": "Number"}';
    const data: unknown[][] = [
      ['name', 'extra', 'age'],
      ['some', 'extradata', '54'],
    ];

    const fmt = new Format(formatString, data[0]);
    const cols = fmt.getCols();

    expect(cols).toStrictEqual(['name', 'age']);

    const { row, cellErrs } = fmt.resolveRawRow({ index: 0, values: data[1] });
    expect(cellErrs).toStrictEqual([]);
    expect(row).toStrictEqual({ num: 1, values: ['some', 54] });
  });

  it('resolveRawRowWithCellErrs', () => {
    const formatString = '{"name": "String", "age": "Number"}';
    const data: unknown[][] = [
      ['name', 'extra', 'age'],
      ['some', 'extradata', undefined],
    ];

    const fmt = new Format(formatString, data[0]);
    const cols = fmt.getCols();

    expect(cols).toStrictEqual(['name', 'age']);

    const { row, cellErrs } = fmt.resolveRawRow({ index: 0, values: data[1] });
    expect(cellErrs).toStrictEqual([{ row: 1, col: 2 }]);
    expect(row).toStrictEqual({ num: 1, values: ['some', null] });
  });

  it('resolveRawRowWithOptionals', () => {
    const formatString =
      '{"name": "String", "age": "Number", "nums?": "Array<Number>"}';
    const data: unknown[][] = [
      ['name', 'extra', 'age', 'extra2', 'nums'],
      ['some', 'extradata', undefined, 'extradata', '3,6,4'],
      ['some', 'extradata', 32, 'extradata', undefined],
    ];

    const fmt = new Format(formatString, data[0]);
    const cols = fmt.getCols();

    expect(cols).toStrictEqual(['name', 'age', 'nums']);

    const r1 = fmt.resolveRawRow({ index: 0, values: data[1] });
    expect(r1.cellErrs).toStrictEqual([{ row: 1, col: 2 }]);
    expect(r1.row).toStrictEqual({ num: 1, values: ['some', null, [3, 4, 6]] });

    const r2 = fmt.resolveRawRow({ index: 1, values: data[2] });
    expect(r2.cellErrs).toStrictEqual([]);
    expect(r2.row).toStrictEqual({ num: 2, values: ['some', 32, undefined] });
  });
});
