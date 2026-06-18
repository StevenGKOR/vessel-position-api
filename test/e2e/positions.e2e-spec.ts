import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { INGEST_PARTIAL_HEADER } from '../../src/controllers/positions.controller';
import { createTransactionalDataSource } from '../../src/database/create-transactional-data-source';
import { PositionEntity } from '../../src/entities/position.entity';
import { PositionsController } from '../../src/controllers/positions.controller';
import { PositionRepository } from '../../src/repositories/position.repository';
import { PositionsService } from '../../src/services/positions.service';

const validPosition = {
  vesselId: 5091,
  receivedTimeUtc: '2017-12-20T22:59:12.000Z',
  latitude: 25.91658,
  longitude: -79.50869,
};

describe('positions API (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    initializeTransactionalContext();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'better-sqlite3' as const,
            database: ':memory:',
            entities: [PositionEntity],
            synchronize: true,
          }),
          dataSourceFactory: createTransactionalDataSource,
        }),
        TypeOrmModule.forFeature([PositionEntity]),
      ],
      controllers: [PositionsController],
      providers: [PositionsService, PositionRepository],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    dataSource = moduleFixture.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.getRepository(PositionEntity).clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /positions', () => {
    it('inserts a valid batch and persists rows', async () => {
      const response = await request(app.getHttpServer())
        .post('/positions')
        .send([validPosition])
        .expect(201);

      expect(response.body).toMatchObject({
        received: 1,
        inserted: 1,
        duplicates: 0,
        rejected: 0,
        errors: [],
      });
      expect(await dataSource.getRepository(PositionEntity).count()).toBe(1);
    });

    it('rolls back the entire batch when one row is invalid (client default)', async () => {
      await request(app.getHttpServer())
        .post('/positions')
        .send([validPosition])
        .expect(201);

      await request(app.getHttpServer())
        .post('/positions')
        .send([
          {
            ...validPosition,
            receivedTimeUtc: '2017-12-20T23:59:12.000Z',
            latitude: 26.0,
            longitude: -80.0,
          },
          {
            ...validPosition,
            receivedTimeUtc: '2017-12-21T01:59:12.000Z',
            latitude: 999,
            longitude: -80.0,
          },
        ])
        .expect(400);

      expect(await dataSource.getRepository(PositionEntity).count()).toBe(1);
    });

    it('inserts valid rows only when ingest partial header is set', async () => {
      const response = await request(app.getHttpServer())
        .post('/positions')
        .set(INGEST_PARTIAL_HEADER, 'true')
        .send([
          validPosition,
          { ...validPosition, latitude: 999 },
        ])
        .expect(201);

      expect(response.body).toMatchObject({
        received: 2,
        inserted: 1,
        rejected: 1,
      });
      expect(await dataSource.getRepository(PositionEntity).count()).toBe(1);
    });
  });

  describe('GET /positions/trips', () => {
    it('returns an empty array when no data exists', async () => {
      const response = await request(app.getHttpServer())
        .get('/positions/trips')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns trip summaries for ingested vessels', async () => {
      await request(app.getHttpServer())
        .post('/positions')
        .send([
          validPosition,
          {
            ...validPosition,
            receivedTimeUtc: '2017-12-20T23:59:12.000Z',
            latitude: 26.0,
            longitude: -80.0,
          },
        ])
        .expect(201);

      const summaries = await request(app.getHttpServer())
        .get('/positions/trips')
        .expect(200);

      expect(summaries.body).toHaveLength(1);
      expect(summaries.body[0]).toMatchObject({
        vesselId: 5091,
        total: 2,
      });
      expect(summaries.body[0].positions).toBeUndefined();
    });
  });

  describe('GET /positions/trips/:vesselId/positions', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/positions')
        .send([
          validPosition,
          {
            ...validPosition,
            receivedTimeUtc: '2017-12-20T23:59:12.000Z',
            latitude: 26.0,
            longitude: -79.0,
          },
          {
            ...validPosition,
            receivedTimeUtc: '2018-01-01T00:00:00.000Z',
            latitude: 36.0,
            longitude: 16.0,
          },
        ])
        .expect(201);
    });

    it('returns a paginated page with total count', async () => {
      const page = await request(app.getHttpServer())
        .get('/positions/trips/5091/positions')
        .query({ limit: 2, offset: 1 })
        .expect(200);

      expect(page.body).toMatchObject({ total: 3, limit: 2, offset: 1 });
      expect(page.body.items).toHaveLength(2);
    });

    it('returns 400 for invalid pagination query params', async () => {
      await request(app.getHttpServer())
        .get('/positions/trips/5091/positions')
        .query({ limit: 0 })
        .expect(400);
    });
  });
});
