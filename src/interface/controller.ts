import { Controller, Get, Param } from '@nestjs/common';
import { XlsxUseCase } from 'src/app/usecases.app';

const format = '{"name": "String","age": "Number","nums": "array<number>"}';

@Controller()
export class XlsxController {
  constructor(private readonly use: XlsxUseCase) {}

  @Get('/process/:id')
  async getReadWithHeaders(@Param('id') id: string) {
    const res = await this.use.processData(id);
    return res;
  }

  @Get('/status/:id')
  async getReadWithExtra(@Param('id') id: string) {
    const res = await this.use.checkJobStatus(id);
    return res;
  }

  @Get('/upload')
  async getReadTest() {
    const res = await this.use.uploadFile(
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
