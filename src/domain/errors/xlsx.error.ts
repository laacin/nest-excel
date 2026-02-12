import { AppErr, ERR_CODE } from './base.error';

export class XlsxErr extends AppErr {
  static noXlsxFile() {
    return new XlsxErr(ERR_CODE.INVALID_REQUEST, 'File must be a .xlsx');
  }

  static missingRequiredCol(col: string) {
    return new XlsxErr(
      ERR_CODE.VALIDATION,
      `Table does not contain the required column: ${col}`,
    );
  }
}
