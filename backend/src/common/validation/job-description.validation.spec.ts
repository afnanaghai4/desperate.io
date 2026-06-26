import { BadRequestException } from '@nestjs/common';
import { validateJobDescriptionForAnalysis } from './job-description.validation';

describe('validateJobDescriptionForAnalysis', () => {
  it('allows a detailed job posting', () => {
    expect(() =>
      validateJobDescriptionForAnalysis(
        'Senior Backend Engineer role requiring NestJS, PostgreSQL, Docker, cloud experience, API design responsibilities, and team collaboration.',
      ),
    ).not.toThrow();
  });

  it('rejects a URL-only description', () => {
    expect(() =>
      validateJobDescriptionForAnalysis('https://example.com/jobs/backend'),
    ).toThrow(BadRequestException);
  });

  it('rejects descriptions that are too short', () => {
    expect(() => validateJobDescriptionForAnalysis('Backend job')).toThrow(
      BadRequestException,
    );
  });

  it('rejects descriptions that are too long', () => {
    expect(() =>
      validateJobDescriptionForAnalysis(
        `Backend Engineer role requiring TypeScript skills. ${'a'.repeat(10000)}`,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects obvious non-job prompts before AI analysis', () => {
    expect(() =>
      validateJobDescriptionForAnalysis(
        'Give me the full recipe of chocolate fudge cake with all ingredients, cooking time, and then send me real italian pasta for corporate guests.',
      ),
    ).toThrow(BadRequestException);
  });
});
