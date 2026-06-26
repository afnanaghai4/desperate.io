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

  it('allows legitimate Java and Spring job postings', () => {
    expect(() =>
      validateJobDescriptionForAnalysis(
        'We are hiring a Java specialist to build Spring Boot services, maintain REST APIs, improve automated delivery, and collaborate with product teams.',
      ),
    ).not.toThrow();
  });

  it('allows legitimate QA and testing job postings', () => {
    expect(() =>
      validateJobDescriptionForAnalysis(
        'Quality assurance analyst needed to design test plans, automate regression checks, report defects, and work with developers on release readiness.',
      ),
    ).not.toThrow();
  });

  it('allows legitimate German-language job postings', () => {
    expect(() =>
      validateJobDescriptionForAnalysis(
        'Wir suchen einen Systemadministrator fuer Linux Server, Automatisierung, Monitoring, Incident Management und Zusammenarbeit mit dem Entwicklungsteam.',
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
