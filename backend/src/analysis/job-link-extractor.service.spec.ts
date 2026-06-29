import { BadRequestException } from '@nestjs/common';
import { JobLinkExtractorService } from './job-link-extractor.service';

describe('JobLinkExtractorService', () => {
  let service: JobLinkExtractorService;

  beforeEach(() => {
    service = new JobLinkExtractorService();
    jest
      .spyOn(service as any, 'assertSafeHostname')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('extracts a JSON-LD JobPosting description', async () => {
    jest.spyOn(service as any, 'requestUrl').mockResolvedValue({
      statusCode: 200,
      contentType: 'text/html; charset=utf-8',
      headers: {},
      body: `
        <html>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "JobPosting",
              "title": "Backend Engineer",
              "hiringOrganization": { "name": "Acme" },
              "description": "<p>Build NestJS APIs, PostgreSQL systems, Docker deployments, and collaborate with product teams.</p>",
              "skills": ["NestJS", "PostgreSQL"]
            }
          </script>
        </html>
      `,
    });

    const result = await service.extract('https://example.com/jobs/backend');

    expect(result.description).toContain('Backend Engineer');
    expect(result.description).toContain('Build NestJS APIs');
    expect(result.description).toContain('PostgreSQL');
    expect(result.sourceUrl).toBe('https://example.com/jobs/backend');
  });

  it('falls back to readable static HTML content', async () => {
    jest.spyOn(service as any, 'requestUrl').mockResolvedValue({
      statusCode: 200,
      contentType: 'text/html',
      headers: {},
      body: `
        <html>
          <body>
            <nav>Navigation noise</nav>
            <main>
              Senior Platform Engineer role requiring TypeScript, backend APIs,
              PostgreSQL, cloud operations, incident response, and collaboration.
            </main>
          </body>
        </html>
      `,
    });

    const result = await service.extract('https://example.com/jobs/platform');

    expect(result.description).toContain('Senior Platform Engineer');
    expect(result.description).not.toContain('Navigation noise');
  });

  it('extracts Ashby-style job content from meta description tags', async () => {
    jest.spyOn(service as any, 'requestUrl').mockResolvedValue({
      statusCode: 200,
      contentType: 'text/html; charset=utf-8',
      headers: {},
      body: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Data Analyst @ Air Apps</title>
            <meta name="description" content="ABOUT AIR APPS At Air Apps, we believe in thinking bigger and moving faster. THE ROLE As a Data Analyst, you will analyze product performance, create dashboards, work with SQL and Python, and collaborate with product teams. REQUIREMENTS 3+ years of data analysis experience." />
          </head>
          <body><div id="root"></div><script src="/bundle.js"></script></body>
        </html>
      `,
    });

    const result = await service.extract(
      'https://jobs.ashbyhq.com/airapps/e3f638ee-9874-49f2-8c4f-01367f08f67e',
    );

    expect(result.description).toContain('Data Analyst @ Air Apps');
    expect(result.description).toContain('THE ROLE As a Data Analyst');
    expect(result.description).toContain('SQL and Python');
  });

  it('rejects unsupported URL schemes', async () => {
    await expect(service.extract('file:///etc/passwd')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects localhost targets before fetching', async () => {
    const requestSpy = jest.spyOn(service as any, 'requestUrl');

    await expect(service.extract('http://localhost/jobs')).rejects.toThrow(
      BadRequestException,
    );
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('validates redirect targets before following them', async () => {
    jest.spyOn(service as any, 'requestUrl').mockResolvedValueOnce({
      statusCode: 302,
      contentType: 'text/html',
      headers: { location: 'http://127.0.0.1/internal' },
      body: '',
    });

    await expect(service.extract('https://example.com/jobs')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects non-HTML responses', async () => {
    jest.spyOn(service as any, 'requestUrl').mockResolvedValue({
      statusCode: 200,
      contentType: 'application/json',
      headers: {},
      body: '{"description":"not html"}',
    });

    await expect(service.extract('https://example.com/jobs')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects pages without usable text', async () => {
    jest.spyOn(service as any, 'requestUrl').mockResolvedValue({
      statusCode: 200,
      contentType: 'text/html',
      headers: {},
      body: '<html><body><script>window.__job = true</script></body></html>',
    });

    await expect(service.extract('https://example.com/jobs')).rejects.toThrow(
      BadRequestException,
    );
  });
});
