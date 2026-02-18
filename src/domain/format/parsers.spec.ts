import { parseType } from './parsers';

describe('parser', () => {
  const values = [10, 1, 'hi', false, 'true', { key: 'val' }];
  const arrVals = [
    '10, 5, 32, 2',
    ['32', '10', '25'],
    [7, 1, 5, 6],
    [false, true, true],
    [{ key: 'val' }],
  ];

  it('String', () => {
    const res = values.map((v) => parseType(false, 'string', v));
    expect(res).toStrictEqual(['10', '1', 'hi', 'false', 'true', null]);
  });

  it('Array<String>', () => {
    const res = arrVals.map((v) => parseType(true, 'string', v));
    expect(res).toStrictEqual([
      ['10', '5', '32', '2'],
      ['32', '10', '25'],
      ['7', '1', '5', '6'],
      ['false', 'true', 'true'],
      null,
    ]);
  });

  it('Number', () => {
    const res = values.map((v) => parseType(false, 'number', v));
    expect(res).toStrictEqual([10, 1, null, 0, null, null]);
  });

  it('Array<Number>', () => {
    const res = arrVals.map((v) => parseType(true, 'number', v));
    expect(res).toStrictEqual([
      [2, 5, 10, 32],
      [10, 25, 32],
      [1, 5, 6, 7],
      [0, 1, 1],
      null,
    ]);
  });

  it('Boolean', () => {
    const res = values.map((v) => parseType(false, 'boolean', v));
    expect(res).toStrictEqual([null, true, null, false, true, null]);
  });

  it('Array<Boolean>', () => {
    const res = arrVals.map((v) => parseType(true, 'boolean', v));
    expect(res).toStrictEqual([null, null, null, [false, true, true], null]);
  });
});
