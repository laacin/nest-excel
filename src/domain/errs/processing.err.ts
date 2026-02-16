import { AppErr, ERR_CODE } from './base.err';

export class ProcessingErr extends AppErr {
  lastRowInserted?: number;

  private constructor(code: ERR_CODE, msg: string, lastRow?: number) {
    super(code, msg);
    this.lastRowInserted = lastRow;
  }
}
