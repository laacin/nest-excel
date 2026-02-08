export const toSchema = (format: string): Record<string, string> => {
  const json = JSON.parse(format) as Record<string, unknown>; // NOTE: may fail

  const info = {};
  Object.entries(json).map(([key, val]) => {
    if (typeof val !== 'string') throw new Error('invalid type');
    info[key] = val.toLowerCase();
  });

  return info;
};

export const resolveResult = (
  data: Record<string, unknown>,
  schema: Record<string, string>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  const info = Object.entries(schema);
  for (const [key, typ] of info) {
    const isReq = !key.endsWith('?');
    const isArray = typ.startsWith('array');
    const k = isReq ? key : key.slice(0, -1);
    const t = isArray ? typ.slice(6, -1) : typ;

    const value = data[k];
    const [parsed, ok] = parseTyp(isArray, t, value);
    if (!ok) throw new Error(`wrong type for ${k} ${t}`);
    if (parsed === undefined && isReq) throw new Error(`${k} is required`);

    result[k] = parsed;
  }

  return result;
};

export const parseTyp = (
  isArray: boolean,
  expect: string,
  val: unknown,
): [unknown, boolean] => {
  switch (expect) {
    case 'string':
      return [val, true];
    case 'number':
      if (isArray) return [parseArrayNumber(val), true];
      return [parseNumber(val), true];
  }
  return [undefined, false];
};

// -- Helpers
export const parseNumber = (val: unknown): number | undefined => {
  if (typeof val === 'number') return val;

  const x = Number(val);
  if (!Number.isNaN(x)) return x;
};

export const parseArrayNumber = (val: unknown): number[] | undefined => {
  const parse = (value: unknown): number[] | undefined => {
    switch (typeof value) {
      case 'string':
        return value
          .split(',')
          .map((x) => Number(x))
          .filter((x) => !Number.isNaN(x)); // BUG: <- should reject invalid values

      case 'number':
        return [value];

      case 'boolean':
        if (value) return [1];
        return [0];
    }
  };

  if (Array.isArray(val)) {
    const result: number[] = [];

    for (const v of val) {
      const r = parse(v);
      if (!r) continue;

      result.push(...r);
    }
    return result;
  }

  return parse(val);
};
