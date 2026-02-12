import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppErr, ERR_CODE } from 'src/domain/errors';

// -- Error mapper
const statusMap: Record<ERR_CODE, number> = {
  INTERNAL: 500,
  INVALID_REQUEST: 400,
  VALIDATION: 400,
  RESOURCE_NOT_FOUND: 404,
  CONFLICT: 409,
};

const toHttpError = (e: unknown) => {
  const err = e instanceof AppErr ? e : AppErr.unknown(e);

  const status = statusMap[err.code];
  const code = err.code as string;
  const error = err.message;

  return { error, status, code };
};

// extends http context
export interface ResponseExt extends Response {
  sendErr(e: unknown): void;
}

const implResponseExt = (res: Response): ResponseExt => {
  const ext = res as ResponseExt;

  ext.sendErr = (err: AppErr) => {
    const { error, status, code } = toHttpError(err);
    ext.status(status).send({ error, status, code });
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
