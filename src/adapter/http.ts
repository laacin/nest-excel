import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppErr, ERR_CODE } from '@domain/errs';

// -- Error mapper
const statusMap: Record<ERR_CODE, number> = {
  INTERNAL: 500,
  UNKNOWN: 500,
  INVALID_REQUEST: 400,
  VALIDATION: 400,
  RESOURCE_NOT_FOUND: 404,
  CONFLICT: 409,
};

const toHttpError = (err: unknown) => {
  const appErr = err instanceof AppErr ? err : AppErr.unknown(err);

  const status = statusMap[appErr.code];
  const code = appErr.code as string;
  const error = appErr.message;

  return { ok: false, error, status, code };
};

// extends http context
export interface ResponseExt extends Response {
  sendErr(err: unknown): void;
  respond(status: number, res: unknown): void;
}

const implResponseExt = (res: Response): ResponseExt => {
  const ext = res as ResponseExt;

  ext.sendErr = (err: AppErr) => {
    const { error, status, code } = toHttpError(err);
    ext.status(status).send({ error, status, code });
  };

  ext.respond = (status: number, response: unknown): void => {
    ext.status(status).send({ ok: true, res: response });
  };

  return ext;
};

// Use http methods decorator
export interface HttpContext {
  req: Request;
  res: ResponseExt;
}

export const UseContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): HttpContext => {
    const http = ctx.switchToHttp();

    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const resExt = implResponseExt(res);

    return { req, res: resExt };
  },
);
