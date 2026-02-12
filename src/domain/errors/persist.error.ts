import { AppErr, ERR_CODE } from './base.error';

export class PersistErr extends AppErr {
  static jobExist() {
    return new PersistErr(ERR_CODE.CONFLICT, 'job already exists');
  }

  static jobNotFound() {
    return new PersistErr(ERR_CODE.NOT_FOUND, 'job not found');
  }
}
