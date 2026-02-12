import { AppErr, ERR_CODE } from './base.error';

export class XlsxError extends AppErr {
  static noXlsxFile() {
    return new XlsxError(ERR_CODE.INVALID_REQUEST, 'File must be a .xlsx');
  }

  static missingRequiredCol(col: string) {
    return new XlsxError(
      ERR_CODE.VALIDATION,
      `Table does not contain the required column: ${col}`,
    );
  }
}
