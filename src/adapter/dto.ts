import { Request } from 'express';
import { FileErr, FmtErr, JobErr } from '@domain/errs';

export class Dto {
  static uploadReq(req: Request) {
    if (!req.file) throw FileErr.missing();

    const filename = req.file.path;
    if (!filename.endsWith('.xlsx')) throw FileErr.invalid();

    const { format } = req.body as Record<string, string>;
    if (!format || typeof format !== 'string') throw FmtErr.missing();

    return { filename, formatString: format };
  }

  static statusReq(jobId: unknown) {
    if (typeof jobId !== 'string' || !UUID_V4_REGEX.test(jobId)) {
      throw JobErr.notFound();
    }

    return { jobId };
  }

  static dataReq(jobId: unknown, input: Record<string, unknown>) {
    if (typeof jobId !== 'string' || !UUID_V4_REGEX.test(jobId)) {
      throw JobErr.notFound();
    }

    const desc = Boolean(input.desc ?? false);
    let page = Number(input.page ?? NaN);
    let take = Number(input.take ?? NaN);
    page = !Number.isNaN(page) && page > 0 ? page : 1;
    take = !Number.isNaN(take) && take > 0 ? take : DEFAULT_TAKE;

    page = page > MAX_PAGE ? MAX_PAGE : page;

    const limit = take > MAX_TAKE ? MAX_TAKE : take;
    const offset = (page - 1) * limit;

    return {
      jobId,
      limit,
      offset,
      desc,
    };
  }
}

const MAX_PAGE = 1_000_000;
const DEFAULT_TAKE = 50;
const MAX_TAKE = 100;

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
