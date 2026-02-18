import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UseCase } from 'src/app/usecases.app';
import { File } from './interceptor.adapter';
import { type HttpContext, UseContext } from './http.adapter';
import { Dto } from './dto.adapter';

const FILE_DESTINATION = 'tmp';

@Controller()
export class Controllers {
  constructor(private readonly use: UseCase) {}

  @Post('/upload')
  @File({ field: 'file', dest: FILE_DESTINATION })
  async postUploadFile(@UseContext() { req, res }: HttpContext) {
    try {
      const { filename, format } = Dto.uploadReq(req);

      const response = await this.use.handleUploadFile(filename, format);
      res.status(201).send(response);
    } catch (err) {
      res.sendErr(err);
    }
  }

  @Get('/status/:id')
  async getStatus(@UseContext() { res }: HttpContext, @Param('id') id: string) {
    try {
      const { jobId } = Dto.statusReq(id);

      const response = await this.use.handleStatusRequest(jobId);
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
      const dto = Dto.dataReq(id, query);

      const response = await this.use.handleRowsRequest(dto);
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
      const dto = Dto.dataReq(id, query);

      const response = await this.use.handleCellErrsRequest(dto);
      res.status(200).send(response);
    } catch (err) {
      res.sendErr(err);
    }
  }
}
