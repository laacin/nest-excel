import { AppErr, ERR_CODE } from './base.error';

export class FmtErr extends AppErr {
  static invalidFormat() {
    return new FmtErr(ERR_CODE.INVALID_REQUEST, 'Invalid format');
  }

  static noStringType() {
    return new FmtErr(ERR_CODE.VALIDATION, 'Types must be declared as strings');
  }

  static emptyColumn() {
    return new FmtErr(ERR_CODE.VALIDATION, 'Column name cannot be empty');
  }

  static invalidType(received: string) {
    return new FmtErr(
      ERR_CODE.VALIDATION,
      `Type ${received} is not supported or is invalid`,
    );
  }
}
