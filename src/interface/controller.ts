import { Controller, Get } from '@nestjs/common';
import { XlsxUseCase } from 'src/app/usecases.app';
import { newSchema } from 'src/domain/format';

const format = '{"name": "String","age": "Number","nums": "array<number>"}';
const schema = newSchema(format);

@Controller()
export class XlsxController {
  constructor(private readonly use: XlsxUseCase) {}

  @Get()
  async getReadTest() {
    const response = await this.use.uploadTest(process.env.TEST_FILE!, schema);
    return response;
  }
}
