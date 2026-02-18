export enum ERR_CODE {
  INTERNAL = 'INTERNAL',
  INVALID_REQUEST = 'INVALID_REQUEST',
  VALIDATION = 'VALIDATION',
  CONFLICT = 'CONFLICT',
  NOT_FOUND = 'RESOURCE_NOT_FOUND',
}

export class AppErr extends Error {
  protected constructor(
    public code: ERR_CODE,
    msg: string,
  ) {
    super(msg);
  }

  static internal(msg: string) {
    console.error(msg);
    return new AppErr(ERR_CODE.INTERNAL, 'Something went wrong');
  }

  static unknown(_problem: unknown) {
    //console.error(problem);
    return new AppErr(ERR_CODE.INTERNAL, 'Something went wrong');
  }
}
