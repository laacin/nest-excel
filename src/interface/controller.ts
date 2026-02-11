import { Controller, Get, Param, Query } from '@nestjs/common';
import { XlsxUseCase } from 'src/app/usecases.app';

const format = '{"name": "String","age": "Number","nums": "Array<Number>"}';

interface PaginationQuery {
  page?: number;
  limit?: number;
  info?: boolean;
  errors?: boolean;
}

@Controller()
export class XlsxController {
  constructor(private readonly use: XlsxUseCase) {}

  @Get('/data/:id')
  async getData(@Param('id') id: string, @Query() query: PaginationQuery) {
    const limit = query.limit ?? 100;
    const offset = query.page ? limit * (query.page + -1) : 0;

    const res = await this.use.handleResultReq(id, {
      tableInfo: query.info,
      rows: { limit, offset },
      errors: { limit, offset },
    });
    return res;
  }

  @Get('/status/:id')
  async getReadWithExtra(@Param('id') id: string) {
    const res = await this.use.handleStatusReq(id);
    return res;
  }

  @Get('/upload/big')
  async getReadBig() {
    const res = await this.use.handleUploadReq(
      process.env.TEST_BIG_FILE!,
      format,
    );
    return res;
  }

  @Get('/upload')
  async getReadTest() {
    const res = await this.use.handleUploadReq(
      process.env.TEST_FILE_WITH_ERRORS!,
      format,
    );
    return res;
  }

  @Get()
  getHello() {
    return 'hello';
  }
}
