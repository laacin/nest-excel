import { Controller, Get } from '@nestjs/common';
import { XlsxUseCase } from 'src/app/usecases.app';
import { Format } from 'src/domain/format';

const format = '{"name": "String","age": "Number","nums": "array<number>"}';
const fmt = new Format(format);

@Controller()
export class XlsxController {
  constructor(private readonly use: XlsxUseCase) {}

  @Get('/errs')
  getReadWithHeaders() {
    const response = this.use.uploadTest(
      process.env.TEST_FILE_WITH_ERRORS!,
      fmt,
    );
    return response;
  }

  @Get('/extra')
  getReadWithExtra() {
    const response = this.use.uploadTest(
      process.env.TEST_FILE_WITH_EXTRA!,
      fmt,
    );
    return response;
  }

  @Get()
  getReadTest() {
    const response = this.use.uploadTest(process.env.TEST_FILE!, fmt);
    return response;
  }
}
