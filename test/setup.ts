import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MainModule } from 'src/main.module';
import { SheetMock } from './mocks';
import { App } from 'supertest/types';
import { MongoImpl } from 'src/infra/persist/repository';
import { PERSIST } from 'src/domain/repository';

export const setupBefore = async () => {
  const mainModule = await MainModule.forRootAsync({
    infra: { mongo: { host: 'localhost', port: 27017, db: 'test' } },
    app: {
      queueName: 'test.queue',
      sheetClass: SheetMock,
    },
  });

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [mainModule],
  }).compile();

  const app: INestApplication<App> = moduleFixture.createNestApplication();
  return app;
};

export const downDB = async (app: INestApplication) => {
  const mongo: MongoImpl = app.get(PERSIST);
  await mongo.onModuleDestroy();
};

export const upDB = async (app: INestApplication) => {
  const mongo: MongoImpl = app.get(PERSIST);
  await mongo.connect('mongodb://localhost:27017/test');
};
