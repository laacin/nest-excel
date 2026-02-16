import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UseCase } from 'src/app/usecases.app';
import { File } from './interceptor';
import { type HttpContext, UseContext } from './http.interface';
import { AppErr } from 'src/domain/errs';

const FILE_DESTINATION = 'tmp';

@Controller()
export class Controllers {
  constructor(private readonly use: UseCase) {}

  @Post('/upload')
  @File({ field: 'file', dest: FILE_DESTINATION })
  async postUploadFile(@UseContext() { req, res }: HttpContext) {
    try {
      if (!req.file) throw AppErr.wrongRequest('missing file');

      const { format } = req.body as Record<string, unknown>;
      if (!format) throw AppErr.wrongRequest('missing format');

      const response = await this.use.handleUploadFile(
        req.file.path,
        format as string,
      );

      res.status(201).send(response);
    } catch (err) {
      res.sendErr(err);
    }
  }

  @Get('/status/:id')
  async getStatus(@UseContext() { res }: HttpContext, @Param('id') id: string) {
    try {
      const response = await this.use.handleStatusRequest(id);
      res.status(200).send(response);
    } catch (err) {
      res.sendErr(err);
    }
  }

  @Get('/rows/:id')
  async getRows(
    @UseContext() { res }: HttpContext,
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    try {
      const { page, take, desc, mapped } = query;

      const response = await this.use.handleDataRequest(id, {
        which: 'rows',
        page: page as number,
        take: take as number,
        desc: desc as boolean,
        mapped: mapped as boolean,
      });

      res.status(200).send(response);
    } catch (err) {
      res.sendErr(err);
    }
  }

  @Get('/errs/:id')
  async getErrors(
    @UseContext() { res }: HttpContext,
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    try {
      const { page, take, desc } = query;

      const response = await this.use.handleDataRequest(id, {
        which: 'cellErrs',
        page: page as number,
        take: take as number,
        desc: desc as boolean,
      });

      res.status(200).send(response);
    } catch (err) {
      res.sendErr(err);
    }
  }
}
