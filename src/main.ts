import { NestFactory } from '@nestjs/core';
import { MainModule } from './main.module';

async function bootstrap() {
  const app = await NestFactory.create(await MainModule.forRootAsync({}));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((e) => console.error(e));
