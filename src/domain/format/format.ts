import { CellErr, RawRow, Row } from '@domain/entity';
import { FmtErr, ParseErr } from '@domain/errs';
import { ValidType, isValidType, parseType } from '@domain/format/parser';

export interface FormatRules {
  name: string;
  isRequired: boolean;
  isArray: boolean;
  type: ValidType;
}

export class Format {
  private rules: FormatRules[];
  private cols: string[]; // valid columns
  private index: number[];

  constructor(formatString: string, rawCols?: unknown[]) {
    try {
      const formatJson = JSON.parse(formatString) as Record<string, unknown>;
      const rules: FormatRules[] = [];

      Object.entries(formatJson).forEach(([key, val]) => {
        if (typeof val !== 'string') {
          throw FmtErr.noStringType();
        }

        const t = val.trim().toLowerCase();
        const k = key.trim();

        const isRequired = !k.endsWith('?');
        const isArray = t.startsWith('array<');
        const name = k.replace(/\?$/, '');
        const type = isArray ? t.replace(/^array<|>$/g, '') : t;

        if (!name) throw FmtErr.emptyCol();
        if (!isValidType(type)) {
          throw FmtErr.invalidType(type);
        }

        rules.push({ name, isRequired, isArray, type });
      });

      this.rules = rules;
      if (rawCols) this.loadRawCols(rawCols);
    } catch (e) {
      throw e instanceof FmtErr ? e : FmtErr.invalid();
    }
  }

  resolveRawRow(rawRow: RawRow): { row: Row; cellErrs?: CellErr[] } {
    const row: Row = { num: rawRow.index + 1, values: [] };
    const cellErrs: CellErr[] = [];

    for (let i = 0; i < this.rules.length; i++) {
      const value = rawRow.values[this.index[i]];
      const rule = this.rules[i];

      // CellErr helper function
      const addCellErr = () => {
        cellErrs.push({
          col: i + 1, // <- starts at 1; index is 0-based
          row: rawRow.index + 1, // same here
        });
        row.values.push(null);
      };

      if (value === undefined) {
        if (rule.isRequired) {
          addCellErr();
          continue;
        }

        row.values.push(undefined);
        continue;
      }

      const parsed = parseType(rule.isArray, rule.type, value);
      if (parsed === null) {
        addCellErr();
        continue;
      }

      row.values.push(parsed);
    }

    return { row, cellErrs };
  }

  // lazy load rawCols
  loadRawCols(rawCols: unknown[]) {
    if (rawCols.length < 1) throw ParseErr.noValidCols();

    const index: number[] = [];
    this.rules.forEach((rule) => {
      const i = rawCols.indexOf(rule.name);

      if (i < 0 && rule.isRequired) {
        throw ParseErr.missingRequiredCol(rule.name);
      }

      index.push(i);
    });

    const cols = index.map((i) => rawCols[i] as string);

    this.cols = cols;
    this.index = index;
  }

  // returns the valid columns name in order
  getCols(): string[] {
    return this.cols;
  }
}
