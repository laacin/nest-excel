import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { RabbitMqImpl } from '@infra/queue/amqp';
import { MESSAGING } from '@domain/repository';
import { sleep } from '@test/test-utils';
import { ApiTest } from '@test/test-api-requests';
import { downDB, setupBefore, upDB } from '@test/test-setup';
import { mockSheets } from '@test/test-mocks';
import { STATUS } from '@domain/entity';
import { ParseErr } from '@domain/errs';

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

    while (true) {
      const { status } = (await api.statusReq(jobId)).Ok(200);

      if (status === STATUS.DONE) break;
      await sleep(1000);
    }

    const rows = (await api.rowsReq(jobId, { take: 2 })).Ok(200);
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
      if (status === STATUS.PROCESSING) {
        await downDB(app);
        break;
      }

      await sleep(2000);
    }

    (await api.statusReq(jobId)).Err(500);
    await upDB(app);

    while (true) {
      const { status } = (await api.statusReq(jobId)).Ok(200);
      if (status === STATUS.DONE) break;

      await sleep(2000);
    }

    const rows = (await api.rowsReq(jobId, { take: 1 })).Ok(200);
    expect(rows).toEqual([
      {
        name: 'name1',
        age: 32,
        extra: 'extra',
        nums: [1, 2, 4, 5],
      },
    ]);
  }, 10000);

  it('with_cell_errs', async () => {
    const file = 'invalid_types.xlsx';
    const format =
      '{ "name": "String", "age": "Number", "nums": "Array<Number>" }';

    const { jobId } = (await api.uploadFile({ file, format })).Ok(201);

    while (true) {
      const { status } = (await api.statusReq(jobId)).Ok(200);
      if (status === STATUS.DONE) break;

      await sleep(1000);
    }

    const [rows, cellErrs] = await Promise.all([
      api.rowsReq(jobId, { take: 2 }),
      api.cellErrsReq(jobId, { take: 2 }),
    ]);

    expect(rows.Ok(200)).toEqual([
      { name: 'name5', age: null, nums: [1, 2] },
      { name: 'name6', age: 42, nums: null },
    ]);

    expect(cellErrs.Ok(200)).toEqual([
      { row: 1, col: 2 },
      { row: 2, col: 3 },
    ]);
  });

  it('request_error_in_middle_of_process', async () => {
    const file = 'valid.xlsx';
    const format = '{ "other": "Boolean" }';

    const { jobId } = (await api.uploadFile({ file, format })).Ok(201);

    while (true) {
      const job = (await api.statusReq(jobId)).Ok(200);

      if (job.status !== STATUS.ERROR) {
        await sleep(1000);
        continue;
      }

      expect(job.reason).toEqual(ParseErr.missingRequiredCol('other').message);
      break;
    }
  });
});
