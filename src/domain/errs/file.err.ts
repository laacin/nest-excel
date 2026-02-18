import { AppErr, ERR_CODE } from '@domain/errs/base.err';

export class FileErr extends AppErr {
  static missing() {
    return new FileErr(ERR_CODE.INVALID_REQUEST, 'Missing file');
  }

  static invalid() {
    return new FileErr(ERR_CODE.INVALID_REQUEST, 'Invalid file');
  }
}
