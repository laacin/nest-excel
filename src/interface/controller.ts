import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UseCase } from 'src/app/usecases.app';
import { File } from './interceptor';
import { type HttpContext, UseContext } from './http.interface';
import { AppErr } from 'src/domain/errors';

const FILE_DESTINATION = 'tmp';

// TODO: parse no string values
interface PaginationQuery {
  page?: number;
  limit?: number;
  cols?: boolean;
  error?: boolean;
  errors?: boolean;
}

@Controller()
export class Controllers {
  constructor(private readonly use: UseCase) {}

  @Post('/upload')
  @File({ field: 'file', dest: FILE_DESTINATION })
  async uploadFile(@UseContext() { req, res }: HttpContext) {
    try {
      if (!req.file) throw AppErr.wrongRequest('missing file');

      const { format } = req.body as Record<string, unknown>;
      if (!format) throw AppErr.wrongRequest('missing format');

      const response = await this.use.handleUpload(
        req.file.path,
        format as string,
      );

      res.status(201).send({ response });
    } catch (e) {
      res.sendErr(e);
    }
  }

  @Get('/status/:id')
  async getReadWithExtra(
    @UseContext() { res }: HttpContext,
    @Param('id') id: string,
  ) {
    try {
      const response = await this.use.handleStatusRequest(id);
      res.status(200).send({ response });
    } catch (e) {
      res.sendErr(e);
    }
  }

  @Get('/data/:id')
  async getData(
    @UseContext() { res }: HttpContext,
    @Param('id') id: string,
    @Query() query: PaginationQuery,
  ) {
    try {
      const limit = query.limit ?? 100;
      const offset = (query.page ?? 1 - 1) * limit;

      const response = await this.use.handleDataRequest(id, {
        errors: { limit, offset },
        rows: { limit, offset },
        columns: query.cols,
        error: query.error,
      });

      res.status(200).send({ response });
    } catch (e) {
      res.sendErr(e);
    }
  }
}
