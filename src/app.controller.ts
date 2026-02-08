import { Controller, Get } from '@nestjs/common';
import { toSchema, resolveResult } from './domain/schema';
import { AppService } from './app.service';

const format = '{"name":"String","age":"Number","nums":"array<number>"}';
const schema = toSchema(format);

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getRead() {
    const result: Record<string, unknown>[] = [];

    await this.appService.readXlsx(FILE_WITH_ERRORS, 100, async (b) => {
      return new Promise((ok, _err) => {
        for (const seg of b) {
          const resolve = resolveResult(seg, schema);
          result.push(resolve);
        }
        ok();
      });
    });

    console.log(result);
    return result;
  }
}
