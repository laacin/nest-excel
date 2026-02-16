import { AppErr, ERR_CODE } from './base.err';

export class FileErr extends AppErr {
  static noXlsx() {
    return new FileErr(ERR_CODE.INVALID_REQUEST, 'File must be a .xlsx');
  }

  static noCols() {
    return new FileErr(ERR_CODE.INVALID_REQUEST, "File doesn't have vali");
  }

  static missingRequiredCol(col: string) {
    return new FileErr(
      ERR_CODE.VALIDATION,
      `Table does not contain the required column: ${col}`,
    );
  }
}
