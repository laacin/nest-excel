import { AppErr, ERR_CODE } from './base.err';

export class PersistErr extends AppErr {
  static jobExist() {
    return new PersistErr(ERR_CODE.CONFLICT, 'job already exists');
  }

  static jobInProcess() {
    return new PersistErr(ERR_CODE.INVALID_REQUEST, 'job in process');
  }

  static jobNotFound() {
    return new PersistErr(ERR_CODE.NOT_FOUND, 'job not found');
  }
}
