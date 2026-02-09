import { Row, RowError } from './entity';

export type Format = Record<string, string>;
type FormatType = 'string' | 'number' | 'boolean' | 'date';

export const newSchema = (format: string): Format => {
  try {
    const json = JSON.parse(format) as Format;

    const schema = {};
    Object.entries(json).map(([key, val]) => {
      if (typeof val !== 'string') {
        throw new Error('types must be declared as strings');
      }
      schema[key] = val.toLowerCase();
    });

    return schema;
  } catch {
    throw new Error('invalid format');
  }
};

export const resolveRow = (
  schema: Format,
  row: Row,
): [Row, RowError[] | null] => {
  const result: Record<string, unknown> = {};
  const errs: RowError[] = [];

  const info = Object.entries(schema);
  let col = 1;
  for (const [key, typ] of info) {
    const isReq = !key.endsWith('?');
    const isArray = typ.startsWith('array');
    const k = isReq ? key : key.slice(0, -1);
    const t = isArray ? typ.slice(6, -1) : typ;

    const v = row.data[k];
    const parsed = parseTyp(isArray, t as FormatType, v);

    if (typeof parsed !== t && !isArray && parsed !== null) {
      throw new Error(
        `parser error: expect: ${t}, have: ${typeof parsed}, raw: ${typeof v}`,
      );
    }

    if (parsed === null || (v === undefined && isReq)) {
      errs.push({
        row: row.index,
        col,
        reason: v === undefined ? 'missing' : 'invalid',
      });
    }

    result[k] = parsed;
    col++;
  }

  const newRow: Row = {
    index: row.index,
    data: result,
  };

  return [newRow, errs.length < 1 ? null : errs] as const;
};

export const parseTyp = (
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

// -- Parsers
const parseString = (v: unknown): string => {
  return String(v);
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
