import { FormatInfo, FormatType } from './format';
import { Row, CellError } from '../entity';
import { AppErr } from '../errors';

interface ResolveRowParams {
  fmt: FormatInfo[];
  colIndex: number[];
  rowIdx: number;
  rowData: unknown[];
}

interface ResolveRowReturn {
  row: Row;
  errs?: CellError[];
}

export const resolveRow = ({
  fmt,
  colIndex,
  rowIdx,
  rowData,
}: ResolveRowParams): ResolveRowReturn => {
  const result: unknown[] = [];
  const errs: CellError[] = [];

  for (let i = 0; i < fmt.length; i++) {
    const cellValue = rowData[colIndex[i]];
    const info = fmt[i];

    if (info.isRequired && cellValue === undefined) {
      errs.push({
        col: i + 1, // <- starts at 1, idx is 0-based;
        row: rowIdx + 1, // same here
      });
      result.push(null);
      continue;
    }

    const parsed = parseTyp(info.isArray, info.typ, cellValue);
    if (typeof parsed !== info.typ && !info.isArray && parsed !== null) {
      throw AppErr.internal(
        `parser error: expect: ${info.typ}, have: ${typeof parsed}, raw: ${typeof cellValue}`,
      );
    }

    if (parsed === null) {
      errs.push({
        col: i + 1,
        row: rowIdx + 1,
      });
    }
    result.push(parsed);
  }

  const row: Row = {
    num: rowIdx + 1,
    data: result,
  };

  return { row, errs };
};

// -- Parsers
// TODO: support date

const parseTyp = (
  isArray: boolean,
  expect: FormatType,
  v: unknown,
): unknown => {
  switch (expect) {
    case 'string':
      return parseString(v);

    case 'number':
      if (isArray) return parseArrayNumber(v, true);
      return parseNumber(v);

    case 'boolean':
      if (isArray) return parseArrayBool(v);
      return parseBool(v);
  }
  return null;
};

const parseString = (v: unknown): string | null => {
  if (typeof v === 'object' || v === undefined || v === null) return null;
  return String(v as unknown);
};

const parseNumber = (v: unknown): number | null => {
  const x = Number(v);
  return Number.isNaN(x) ? null : x;
};

const parseArrayNumber = (v: unknown, ordered?: boolean): number[] | null => {
  const parse = (val: unknown): number[] | null => {
    if (typeof val === 'string') {
      const arr = val.split(',').map((x) => Number(x.trim()));
      return arr.some(Number.isNaN) ? null : arr;
    }
    const x = parseNumber(val);
    return x === null ? null : [x];
  };

  let result: number[] | null = null;

  if (Array.isArray(v)) {
    for (const val of v) {
      const r = parse(val);
      if (r === null) return null;

      if (result === null) result = [];
      result.push(...r);
    }
  } else {
    result = parse(v);
  }

  if (result !== null && ordered) result.sort((a, b) => a - b);
  return result;
};

const parseBool = (v: unknown): boolean | null => {
  if (typeof v === 'boolean') return v;

  if (typeof v === 'number') {
    return v === 0 ? false : v === 1 ? true : null;
  }

  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'false' || s === '0') return false;
    if (s === 'true' || s === '1') return true;
  }

  return null;
};

const parseArrayBool = (v: unknown): boolean[] | null => {
  const parse = (val: unknown): boolean[] | null => {
    if (typeof val === 'string') {
      const arr = val.split(',').map(parseBool);
      return arr.some((x) => x === null) ? null : (arr as boolean[]);
    }
    const x = parseBool(val);
    return x === null ? null : [x];
  };

  if (Array.isArray(v)) {
    let result: boolean[] | null = null;

    for (const val of v) {
      const r = parse(val);
      if (!r) continue;

      if (result === null) result = [];
      result.push(...r);
    }

    return result;
  }

  return parse(v);
};
