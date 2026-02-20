import { NestFactory } from '@nestjs/core';
import { MainModule } from 'src/main.module';

async function bootstrap() {
  const mod = await MainModule.forRootAsync({
    infra: {
      /// docker config
      mongo: { host: 'mongo', port: 27017, db: 'mydb' },
      amqp: { host: 'amqp', port: 5672, user: 'guest', pass: 'guest' },

      /// local config
      // mongo: { host: 'localhost', port: 27017, db: 'mydb' },
      // amqp: { host: 'localhost', port: 5672, user: 'guest', pass: 'guest' },
    },
  });

  const app = await NestFactory.create(mod);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((e) => console.error(e));
