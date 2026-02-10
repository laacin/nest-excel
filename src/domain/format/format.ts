export type FormatType = 'string' | 'number' | 'boolean' | 'date';

export interface FormatInfo {
  name: string;
  isRequired: boolean;
  isArray: boolean;
  typ: FormatType;
}

export class Format {
  private info: FormatInfo[];

  constructor(input: string) {
    try {
      const json = JSON.parse(input) as Record<string, unknown>;

      const fmt: FormatInfo[] = [];
      Object.entries(json).map(([key, val]) => {
        if (typeof val !== 'string') {
          throw new Error('types must be declared as strings');
        }
        const t = val.toLowerCase();

        const isRequired = !key.endsWith('?');
        const isArray = t.startsWith('array');
        const name = isRequired ? key : key.slice(0, -1);
        const typ = isArray ? t.slice(6, -1) : t;

        if (!isFormatType(typ)) {
          throw new Error(`type ${typ} is not supported`);
        }

        fmt.push({ name, isRequired, isArray, typ });
      });

      this.info = fmt;
    } catch (e) {
      throw e instanceof Error ? e : new Error('invalid format');
    }
  }

  getColIndex(cols: string[]): number[] {
    const index: number[] = [];

    this.info.forEach((info) => {
      const idx = cols.indexOf(info.name);
      if (idx < 0 && info.isRequired) {
        throw new Error(
          `table does not contain the required column: ${info.name}`,
        );
      }
      index.push(idx);
    });

    return index;
  }

  getInfo(): FormatInfo[] {
    return this.info;
  }
}

// helpers;
const isFormatType = (v: string): v is FormatType => {
  return v === 'string' || v === 'number' || v === 'boolean' || v === 'date';
};
