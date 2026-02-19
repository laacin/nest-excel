import { AppErr, ERR_CODE } from '@domain/errs/base.err';

export class FmtErr extends AppErr {
  static missing() {
    return new FmtErr(ERR_CODE.INVALID_REQUEST, 'Missing format');
  }

  static invalid() {
    return new FmtErr(ERR_CODE.INVALID_REQUEST, 'Invalid format');
  }

  static emptyCol() {
    return new FmtErr(ERR_CODE.VALIDATION, 'Column name cannot be empty');
  }

  static noStringType() {
    return new FmtErr(ERR_CODE.VALIDATION, 'Types must be declared as strings');
  }

  static invalidType(received: string) {
    return new FmtErr(
      ERR_CODE.VALIDATION,
      `Type '${received}' is not supported or is invalid`,
    );
  }
}
