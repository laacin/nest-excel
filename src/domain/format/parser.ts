export type ValidType = 'string' | 'number' | 'boolean' | 'date';

export const isValidType = (v: string): v is ValidType => {
  return v === 'string' || v === 'number' || v === 'boolean' || v === 'date';
};

// TODO: support date
export const parseType = (
  isArray: boolean,
  expect: ValidType,
  v: unknown,
): unknown => {
  switch (expect) {
    case 'string':
      if (isArray) return parseArrayString(v);
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

const parseArrayString = (v: unknown): string[] | null => {
  const parse = (val: unknown): string[] | null => {
    if (typeof val === 'string') {
      const arr = val.split(',').map((x) => x.trim());
      return arr;
    }

    const arr = parseString(val);
    return arr === null ? null : [arr];
  };

  if (Array.isArray(v)) {
    let result: string[] | null = null;

    for (const val of v) {
      const r = parse(val);
      if (r === null) return null;

      if (result === null) result = [];
      result.push(...r);
    }
    return result;
  }
  return parse(v);
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
      if (r === null) return null;

      if (result === null) result = [];
      result.push(...r);
    }
    return result;
  }

  return parse(v);
};
