import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { load } from 'cheerio';
import * as dnsPromises from 'dns/promises';
import * as http from 'http';
import * as https from 'https';
import { IncomingMessage } from 'http';
import { isIP } from 'net';

export interface ExtractedJobLinkContent {
  description: string;
  sourceUrl: string;
}

type HttpResponse = {
  body: string;
  contentType: string;
  statusCode: number;
};

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const REQUEST_TIMEOUT_MS = 5000;
const MAX_EXTRACTED_CHARS = 10000;

@Injectable()
export class JobLinkExtractorService {
  private readonly logger = new Logger(JobLinkExtractorService.name);

  async extract(jobLink: string): Promise<ExtractedJobLinkContent> {
    const initialUrl = this.parseAndValidateUrl(jobLink);
    const { body, contentType, statusCode, finalUrl } =
      await this.fetchHtml(initialUrl);

    if (statusCode < 200 || statusCode >= 300) {
      this.logger.warn(
        `Job link returned non-success status: host=${finalUrl.hostname} status=${statusCode}`,
      );
      throw new BadRequestException('Job link could not be loaded');
    }

    if (!this.isHtmlContentType(contentType)) {
      this.logger.warn(
        `Job link returned non-HTML content: host=${finalUrl.hostname} contentType=${contentType || 'unknown'}`,
      );
      throw new BadRequestException('Job link did not return an HTML page');
    }

    const description = this.extractDescription(body);
    if (!description) {
      this.logger.warn(
        `Job link extraction found no usable content: host=${finalUrl.hostname}`,
      );
      throw new BadRequestException(
        'Could not extract a usable job description from the link',
      );
    }

    return {
      description,
      sourceUrl: finalUrl.toString(),
    };
  }

  private async fetchHtml(
    initialUrl: URL,
  ): Promise<HttpResponse & { finalUrl: URL }> {
    let currentUrl = initialUrl;

    for (
      let redirectCount = 0;
      redirectCount <= MAX_REDIRECTS;
      redirectCount++
    ) {
      await this.assertSafeHostname(currentUrl.hostname);
      const response = await this.requestUrl(currentUrl);

      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        currentUrl = this.parseAndValidateUrl(
          response.headers.location,
          currentUrl,
        );
        continue;
      }

      return {
        body: response.body,
        contentType: response.contentType,
        statusCode: response.statusCode,
        finalUrl: currentUrl,
      };
    }

    throw new BadRequestException('Job link redirected too many times');
  }

  private requestUrl(
    url: URL,
  ): Promise<HttpResponse & { headers: http.IncomingHttpHeaders }> {
    const transport = url.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
      const request = transport.request(
        url,
        {
          method: 'GET',
          timeout: REQUEST_TIMEOUT_MS,
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent': 'desperate.io-job-link-extractor/1.0',
          },
          lookup: (hostname, options, callback) => {
            void dnsPromises
              .lookup(hostname, {
                all: true,
                family: options.family,
                verbatim: true,
              })
              .then((addresses) => {
                const safeAddresses = addresses.filter(
                  (address) => !this.isUnsafeIpAddress(address.address),
                );

                if (safeAddresses.length === 0) {
                  callback(
                    new Error('Unsafe hostname resolution'),
                    options.all ? [] : '',
                  );
                  return;
                }

                if (options.all) {
                  callback(null, safeAddresses);
                  return;
                }

                callback(
                  null,
                  safeAddresses[0].address,
                  safeAddresses[0].family,
                );
              })
              .catch((error: Error) => callback(error, options.all ? [] : ''));
          },
        },
        (response) => {
          this.handleResponse(response, resolve, reject);
        },
      );

      request.on('timeout', () => {
        request.destroy(new Error('Request timed out'));
      });
      request.on('error', (error: NodeJS.ErrnoException) => {
        this.logger.warn(
          `Job link request failed: host=${url.hostname} reason=${error.code || error.message}`,
        );
        reject(new BadRequestException('Job link could not be loaded'));
      });
      request.end();
    });
  }

  private handleResponse(
    response: IncomingMessage,
    resolve: (
      value: HttpResponse & { headers: http.IncomingHttpHeaders },
    ) => void,
    reject: (reason?: unknown) => void,
  ): void {
    const statusCode = response.statusCode ?? 0;
    const headers = response.headers;
    const contentType = String(headers['content-type'] ?? '');
    const contentLength = Number(headers['content-length'] ?? 0);

    if (contentLength > MAX_RESPONSE_BYTES) {
      response.resume();
      reject(new BadRequestException('Job link returned too much content'));
      return;
    }

    let totalBytes = 0;
    const chunks: Buffer[] = [];

    response.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_RESPONSE_BYTES) {
        response.destroy(new Error('Response too large'));
        return;
      }
      chunks.push(chunk);
    });

    response.on('end', () => {
      resolve({
        body: Buffer.concat(chunks).toString('utf8'),
        contentType,
        headers,
        statusCode,
      });
    });

    response.on('error', () => {
      reject(new BadRequestException('Job link could not be loaded'));
    });
  }

  private extractDescription(html: string): string {
    const $ = load(html);
    const jsonLdDescription = this.extractJsonLdJobPosting($);
    if (jsonLdDescription) {
      return this.normalizeText(jsonLdDescription);
    }

    const metaDescription = this.extractMetaDescription($);
    if (metaDescription) {
      return this.normalizeText(metaDescription);
    }

    $('script, style, noscript, nav, footer, header, form, svg').remove();
    const readableRoot = $('main, article, [role="main"]').first();
    const textSource = readableRoot.length > 0 ? readableRoot : $('body');

    return this.normalizeText(textSource.text());
  }

  private extractJsonLdJobPosting($: ReturnType<typeof load>): string {
    const descriptions: string[] = [];

    $('script[type="application/ld+json"]').each((_, element) => {
      const rawJson = $(element).contents().text();
      if (!rawJson.trim()) {
        return;
      }

      try {
        const parsed = JSON.parse(rawJson) as unknown;
        for (const posting of this.findJobPostings(parsed)) {
          descriptions.push(this.serializeJobPosting(posting));
        }
      } catch {
        return;
      }
    });

    return descriptions.find((description) => description.length > 0) ?? '';
  }

  private extractMetaDescription($: ReturnType<typeof load>): string {
    const parts = [
      $('meta[property="og:title"]').attr('content'),
      $('meta[name="title"]').attr('content'),
      $('title').first().text(),
      $('meta[name="description"]').attr('content'),
      $('meta[property="og:description"]').attr('content'),
    ];

    return parts.filter(Boolean).join('\n');
  }

  private findJobPostings(value: unknown): Record<string, unknown>[] {
    if (!value || typeof value !== 'object') {
      return [];
    }

    if (Array.isArray(value)) {
      return value.flatMap((item) => this.findJobPostings(item));
    }

    const objectValue = value as Record<string, unknown>;
    const typeValue = objectValue['@type'];
    const types = Array.isArray(typeValue) ? typeValue : [typeValue];
    const isJobPosting = types.some(
      (type) => typeof type === 'string' && type.toLowerCase() === 'jobposting',
    );

    const nestedValues = Object.values(objectValue).flatMap((item) =>
      this.findJobPostings(item),
    );

    return isJobPosting ? [objectValue, ...nestedValues] : nestedValues;
  }

  private serializeJobPosting(posting: Record<string, unknown>): string {
    const parts = [
      this.stringValue(posting.title),
      this.organizationName(posting.hiringOrganization),
      this.stringValue(posting.description),
      this.stringValue(posting.skills),
      this.stringValue(posting.responsibilities),
      this.stringValue(posting.qualifications),
      this.stringValue(posting.employmentType),
    ];

    return parts.filter(Boolean).join('\n');
  }

  private organizationName(value: unknown): string {
    if (!value || typeof value !== 'object') {
      return '';
    }

    const organization: unknown = Array.isArray(value) ? value[0] : value;
    if (!organization || typeof organization !== 'object') {
      return '';
    }

    return this.stringValue((organization as Record<string, unknown>).name);
  }

  private stringValue(value: unknown): string {
    if (typeof value === 'string') {
      return load(value).text();
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.stringValue(item))
        .filter(Boolean)
        .join(', ');
    }

    return '';
  }

  private normalizeText(value: string): string {
    return value.replace(/\s+/g, ' ').trim().slice(0, MAX_EXTRACTED_CHARS);
  }

  private parseAndValidateUrl(value: string, baseUrl?: URL): URL {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(value, baseUrl);
    } catch {
      throw new BadRequestException('Job link must be a valid URL');
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new BadRequestException('Job link must use HTTP or HTTPS');
    }

    if (parsedUrl.username || parsedUrl.password) {
      throw new BadRequestException('Job link must not include credentials');
    }

    if (this.isUnsafeHostname(parsedUrl.hostname)) {
      throw new BadRequestException('Job link host is not allowed');
    }

    return parsedUrl;
  }

  private async assertSafeHostname(hostname: string): Promise<void> {
    if (this.isUnsafeHostname(hostname)) {
      throw new BadRequestException('Job link host is not allowed');
    }

    const addresses = await dnsPromises.lookup(hostname, {
      all: true,
      verbatim: true,
    });
    if (
      addresses.length === 0 ||
      addresses.some((address) => this.isUnsafeIpAddress(address.address))
    ) {
      throw new BadRequestException('Job link host is not allowed');
    }
  }

  private isHtmlContentType(contentType: string): boolean {
    const normalizedContentType = contentType.toLowerCase();
    return (
      normalizedContentType.includes('text/html') ||
      normalizedContentType.includes('application/xhtml+xml')
    );
  }

  private isUnsafeHostname(hostname: string): boolean {
    const normalizedHostname = hostname.toLowerCase();
    return (
      normalizedHostname === 'localhost' ||
      normalizedHostname.endsWith('.localhost') ||
      this.isUnsafeIpAddress(normalizedHostname)
    );
  }

  private isUnsafeIpAddress(address: string): boolean {
    const ipVersion = isIP(address);
    if (ipVersion === 4) {
      return this.isUnsafeIpv4(address);
    }

    if (ipVersion === 6) {
      return this.isUnsafeIpv6(address);
    }

    return false;
  }

  private isUnsafeIpv4(address: string): boolean {
    const octets = address.split('.').map((octet) => Number(octet));
    const [first, second] = octets;

    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 192 && second === 0) ||
      (first === 192 && second === 0 && octets[2] === 2) ||
      (first === 198 && (second === 18 || second === 19)) ||
      (first === 198 && second === 51 && octets[2] === 100) ||
      (first === 203 && second === 0 && octets[2] === 113) ||
      first >= 224
    );
  }

  private isUnsafeIpv6(address: string): boolean {
    const normalizedAddress = address.toLowerCase();
    return (
      normalizedAddress === '::' ||
      normalizedAddress === '::1' ||
      normalizedAddress.startsWith('fc') ||
      normalizedAddress.startsWith('fd') ||
      normalizedAddress.startsWith('fe80') ||
      normalizedAddress.startsWith('ff') ||
      normalizedAddress.startsWith('::ffff:127.') ||
      normalizedAddress.startsWith('::ffff:10.') ||
      normalizedAddress.startsWith('::ffff:192.168.')
    );
  }
}
