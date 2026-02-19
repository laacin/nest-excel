import { AppErr, ERR_CODE } from '@domain/errs/base.err';

export class ParseErr extends AppErr {
  static noValidCols() {
    return new ParseErr(ERR_CODE.INVALID_REQUEST, 'Table has no valid columns');
  }

  static missingRequiredCol(col: string) {
    return new ParseErr(
      ERR_CODE.VALIDATION,
      `Table does not contain the required column: '${col}'`,
    );
  }
}
