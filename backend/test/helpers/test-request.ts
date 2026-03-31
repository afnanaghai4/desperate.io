import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';

export function createTestRequest(app: INestApplication) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return supertest(app.getHttpServer());
}
