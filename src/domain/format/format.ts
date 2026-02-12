import { AppErr, FmtErr, FileErr } from '../errors';

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
      Object.entries(json).forEach(([key, val]) => {
        if (typeof val !== 'string') {
          throw FmtErr.noStringType();
        }

        const t = val.trim().toLowerCase();
        const k = key.trim();

        const isRequired = !k.endsWith('?');
        const isArray = t.startsWith('array<');
        const name = k.replace(/\?$/, '');
        const typ = isArray ? t.replace(/^array<|>$/g, '') : t;

        if (!name) throw FmtErr.emptyColumn();
        if (!isFormatType(typ)) {
          throw FmtErr.invalidType(typ);
        }

        fmt.push({ name, isRequired, isArray, typ });
      });

      this.info = fmt;
    } catch (e) {
      throw e instanceof AppErr ? e : FmtErr.invalidFormat();
    }
  }

  getColIndex(cols: string[]): number[] {
    const index: number[] = [];

    this.info.forEach((info) => {
      const idx = cols.indexOf(info.name);
      if (idx < 0 && info.isRequired) {
        throw FileErr.missingRequiredCol(info.name);
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
