import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { JobProcessingUseCase } from '@app/usecases/job-processing.usecase';
import { File } from '@adapter/interceptor';
import { type HttpContext, UseContext } from '@adapter/http';
import { Dto } from '@adapter/dto';

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
      res.respond(201, response);
    } catch (err) {
      res.sendErr(err);
    }
  }

  @Get('/status/:id')
  async getStatus(@UseContext() { res }: HttpContext, @Param('id') id: string) {
    try {
      const dto = Dto.statusReq(id);

      const response = await this.use.getStatus(dto);
      res.respond(200, response);
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
      res.respond(200, response);
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
      res.respond(200, response);
    } catch (err) {
      res.sendErr(err);
    }
  }
}
