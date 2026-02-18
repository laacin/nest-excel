import { AppErr, ERR_CODE } from './base.err';

export class JobErr extends AppErr {
  static notFound() {
    return new JobErr(ERR_CODE.NOT_FOUND, 'Job not found');
  }

  static unavailable() {
    return new JobErr(ERR_CODE.INVALID_REQUEST, 'Job is unavailable');
  }
}
