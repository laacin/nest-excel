import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
} from '@nestjs/common';
import { UseCase } from 'src/app/usecases.app';
import { FileIntr } from './interceptor';

interface PaginationQuery {
  page?: number;
  limit?: number;
  info?: boolean;
  errors?: boolean;
}

@Controller()
export class Controllers {
  constructor(private readonly use: UseCase) {}

  @Post('/upload')
  @FileIntr()
  async uploadXlsxFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, unknown>,
  ) {
    if (!file.filename) return { error: 'missing file' };

    const { format } = body;
    if (!format) return { error: 'missing format' };

    const response = await this.use.handleUploadReq(
      file.path,
      format as string,
    );

    return { response };
  }

  @Get('/data/:id')
  async getData(@Param('id') id: string, @Query() query: PaginationQuery) {
    const limit = query.limit ?? 100;
    const offset = query.page ? limit * (query.page + -1) : 0;

    const res = await this.use.handleResultReq(id, {
      tableInfo: query.info,
      rows: { limit, offset },
      errors: { limit, offset },
    });

    return { res };
  }

  @Get('/status/:id')
  async getReadWithExtra(@Param('id') id: string) {
    const res = await this.use.handleStatusReq(id);
    return { res };
  }

  @Get()
  getHello() {
    return 'hello';
  }
}
