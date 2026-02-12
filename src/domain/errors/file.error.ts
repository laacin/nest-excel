import { AppErr, ERR_CODE } from './base.error';

export class FileErr extends AppErr {
  static noXlsx() {
    return new FileErr(ERR_CODE.INVALID_REQUEST, 'File must be a .xlsx');
  }

  static missingRequiredCol(col: string) {
    return new FileErr(
      ERR_CODE.VALIDATION,
      `Table does not contain the required column: ${col}`,
    );
  }
}
