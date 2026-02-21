import { Job } from '@domain/entity';
import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';

export class ApiTest {
  constructor(private readonly app: INestApplication<App>) {}

  async uploadFile(input: { file: string; format: string }) {
    const res = await request(this.app.getHttpServer())
      .post('/upload')
      .attach('file', createBuf(), input.file)
      .field('format', input.format);

    return new ApiResponse<UploadFileResponse>(res);
  }

  async statusReq(jobId: string) {
    const res = await request(this.app.getHttpServer()).get(`/status/${jobId}`);

    return new ApiResponse<Job>(res);
  }

  async rowsReq(jobId: string, opts?: PaginationOpts) {
    const url = `/rows/${jobId}${this.parseParams(opts)}`;
    const res = await request(this.app.getHttpServer()).get(url);

    return new ApiResponse<unknown>(res);
  }

  async cellErrsReq(jobId: string, opts?: PaginationOpts) {
    const url = `/errs/${jobId}${this.parseParams(opts)}`;
    const res = await request(this.app.getHttpServer()).get(url);

    return new ApiResponse<unknown>(res);
  }

  private parseParams(opts?: PaginationOpts) {
    const parts: string[] = [];
    if (opts?.take) parts.push(`take=${opts.take}`);
    if (opts?.page) parts.push(`page=${opts.page}`);
    if (opts?.desc) parts.push(`desc=true`);

    const params = parts.join('&');
    return `?${params}`;
  }
}

class ApiResponse<T> {
  constructor(private readonly res: Response) {}

  Ok(expectedStatus?: number) {
    if (expectedStatus) expect(this.res.status).toBe(expectedStatus);
    return this.resolveRes(this.res, true) as T;
  }

  Err(expectedStatus?: number) {
    if (expectedStatus) expect(this.res.status).toBe(expectedStatus);
    return this.resolveRes(this.res, false) as ErrResponse;
  }

  private resolveRes<T>(res: Response, shouldOk: boolean): Res<T> {
    const body = res.body as Record<string, unknown>;
    const { ok } = body;
    expect(ok).toEqual(shouldOk);

    return ok ? (body.response as Res<T>) : (body.err as Res<T>);
  }
}

// Req/res
interface PaginationOpts {
  take?: number;
  page?: number;
  desc?: boolean;
}

interface ErrResponse {
  reason: string;
  status: number;
  code: string;
}

interface UploadFileResponse {
  jobId: string;
}

// Helpers
type Res<T> = { ok: true; response: T } | (ErrResponse & { ok: false });

const createBuf = () => {
  return Buffer.from('PK\u0003\u0004\u0014\u0000\u0006\u0000');
};
