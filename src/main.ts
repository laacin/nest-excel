import { InfraConfig } from '@infra/config';
import { NestFactory } from '@nestjs/core';
import { MainModule } from 'src/main.module';

const infraCfgs: Record<string, InfraConfig> = {
  local: {
    mongo: { host: 'localhost', port: 27017, db: 'mydb' },
    rabbitmq: { host: 'localhost', port: 5672, user: 'guest', pass: 'guest' },
  },

  docker_dev: {
    mongo: { host: 'mongodb', port: 27017, db: 'mydb' },
    rabbitmq: { host: 'rabbitmq', port: 5672, user: 'guest', pass: 'guest' },
  },
};

async function bootstrap() {
  const deployEnv = process.env.DEPLOY_ENV ?? 'local';
  const infraCfg = infraCfgs[deployEnv];

  const mod = await MainModule.forRootAsync({ infra: infraCfg });

  const app = await NestFactory.create(mod);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((e) => console.error(e));
