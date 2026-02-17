import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { RabbitMqImpl } from 'src/infra/queue/amqp';
import { MESSAGING } from 'src/domain/repository';
import { sleep } from './utils';
import { ApiTest } from './apiRequests';
import { downDB, setupBefore, upDB } from './setup';
import { mockSheets } from './mocks';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let api: ApiTest;

  beforeAll(async () => {
    app = await setupBefore();
    api = new ApiTest(app);
    await app.init();
  });

  afterAll(async () => {
    const amqp: RabbitMqImpl = app.get(MESSAGING);
    await amqp.stopConsumers();
    await app.close();
  });

  it('normal_flow', async () => {
    const file = 'valid.xlsx';
    const format =
      '{"name": "String", "age": "Number", "nums": "Array<Number>"}';

    const { jobId } = (await api.uploadFile({ file, format })).Ok(201);

    for (let i = 0; i < 10; i++) {
      const { status } = (await api.statusReq(jobId)).Ok(200);

      if (status === 'done') break;
      await sleep(1000);
    }

    const rows = (await api.rowsReq(jobId, { mapped: true, take: 2 })).Ok(200);
    expect(rows).toEqual([
      {
        name: 'name1',
        age: 53,
        nums: [1, 2, 4, 5],
      },
      {
        name: 'name2',
        age: 32,
        nums: [1, 2, 4, 5],
      },
    ]);
  });

  it('database_down_in_the_middle_of_process', async () => {
    (() => {
      const f: unknown[][] = [['name', 'age', 'extra', 'nums']];

      for (let i = 0; i < 50000; i++) {
        f.push(['name1', '32', 'extra', '1,2,5,4']);
      }

      mockSheets.set('big.xlsx', f);
    })();

    const file = 'big.xlsx';
    const format =
      '{"name": "String", "age": "Number", "extra": "String", "nums": "Array<Number>"}';

    const { jobId } = (await api.uploadFile({ file, format })).Ok(201);

    while (true) {
      const { status } = (await api.statusReq(jobId)).Ok(200);
      if (status === 'processing') {
        await downDB(app);
        break;
      }
      if (status === 'done') return;

      await sleep(2000);
    }

    (await api.statusReq(jobId)).Err(500);
    await upDB(app);

    while (true) {
      const { status } = (await api.statusReq(jobId)).Ok(200);
      if (status === 'done') break;

      await sleep(2000);
    }

    const rows = (await api.rowsReq(jobId, { take: 1, mapped: true })).Ok(200);
    expect(rows).toEqual([
      {
        name: 'name1',
        age: 32,
        extra: 'extra',
        nums: [1, 2, 4, 5],
      },
    ]);
  }, 50000);
});
