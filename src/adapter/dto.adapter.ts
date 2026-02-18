import { Request } from 'express';
import { AppErr, FileErr, PersistErr } from 'src/domain/errs';

export class Dto {
  static uploadReq(req: Request) {
    if (!req.file) throw AppErr.wrongRequest('Missing file');

    const filename = req.file.path;
    if (!filename.endsWith('.xlsx')) throw FileErr.noXlsx();

    const { format } = req.body as Record<string, string>;
    if (!format || typeof format !== 'string') {
      throw AppErr.wrongRequest('Missing format');
    }

    return { filename, formatString: format };
  }

  static statusReq(jobId: unknown) {
    if (typeof jobId !== 'string' || !UUID_V4_REGEX.test(jobId)) {
      throw PersistErr.jobNotFound();
    }

    return { jobId };
  }

  static dataReq(jobId: unknown, input: Record<string, unknown>) {
    if (typeof jobId !== 'string' || !UUID_V4_REGEX.test(jobId)) {
      throw PersistErr.jobNotFound();
    }

    const desc = Boolean(input.desc);
    let page = Number(input.page);
    let take = Number(input.take);
    page = !Number.isNaN(page) && page > 0 ? page : 1;
    take = !Number.isNaN(take) && take > 0 ? take : 1;

    return {
      jobId,
      limit: take,
      offset: (page - 1) * take,
      desc,
    };
  }
}

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
