import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { JobProcessingUseCase } from 'src/app/usecases.app';
import { File } from './interceptor.adapter';
import { type HttpContext, UseContext } from './http.adapter';
import { Dto } from './dto.adapter';

const FILE_DESTINATION = 'tmp';

@Controller()
export class Controllers {
  constructor(private readonly use: JobProcessingUseCase) {}

  @Post('/upload')
  @File({ field: 'file', dest: FILE_DESTINATION })
  async postUploadFile(@UseContext() { req, res }: HttpContext) {
    try {
      const dto = Dto.uploadReq(req);

      const response = await this.use.uploadFile(dto);
      res.status(201).send(response);
    } catch (err) {
      res.sendErr(err);
    }
  }

  @Get('/status/:id')
  async getStatus(@UseContext() { res }: HttpContext, @Param('id') id: string) {
    try {
      const dto = Dto.statusReq(id);

      const response = await this.use.getStatus(dto);
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

      const response = await this.use.getRows(dto);
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

      const response = await this.use.getCellErrs(dto);
      res.status(200).send(response);
    } catch (err) {
      res.sendErr(err);
    }
  }
}
