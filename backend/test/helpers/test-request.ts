import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';

export function createTestRequest(app: INestApplication) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return supertest(app.getHttpServer());
}

export function createTestAgent(app: INestApplication) {
  // Use .agent() instead of supertest() to persist cookies across requests
  // This is required for HTTP-only cookie-based authentication
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return supertest.agent(app.getHttpServer());
}
