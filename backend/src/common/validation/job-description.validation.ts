import { BadRequestException } from '@nestjs/common';

const JOB_DESCRIPTION_MIN_LENGTH = 50;
const JOB_DESCRIPTION_MAX_LENGTH = 10000;

const JOB_SIGNALS = [
  'job',
  'role',
  'position',
  'responsibilities',
  'requirements',
  'qualifications',
  'experience',
  'skills',
  'engineer',
  'developer',
  'software',
  'backend',
  'frontend',
  'full stack',
  'cloud',
  'devops',
  'database',
  'typescript',
  'javascript',
  'react',
  'node',
  'nestjs',
  'python',
  'aws',
  'docker',
  'kubernetes',
  'salary',
  'employment',
  'candidate',
  'team',
  'company',
];

const NON_JOB_SIGNALS = [
  'recipe',
  'ingredients',
  'cooking',
  'cook',
  'bake',
  'cake',
  'pasta',
  'guests',
  'meal',
  'story',
  'poem',
  'essay',
  'homework',
  'write me',
  'give me',
  'generate',
];

const includesPhrase = (value: string, phrase: string): boolean =>
  new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'i').test(value);

export function validateJobDescriptionForAnalysis(
  jobDescription: string,
): void {
  if (!jobDescription || typeof jobDescription !== 'string') {
    throw new BadRequestException('Invalid or missing jobDescription');
  }

  const trimmedDescription = jobDescription.trim();

  if (/^https?:\/\/.+$/i.test(trimmedDescription)) {
    throw new BadRequestException(
      'Job description cannot be a URL only. Please provide the actual job posting text.',
    );
  }

  if (trimmedDescription.length < JOB_DESCRIPTION_MIN_LENGTH) {
    throw new BadRequestException(
      'Job description is too short. Please provide a more detailed description.',
    );
  }

  if (trimmedDescription.length > JOB_DESCRIPTION_MAX_LENGTH) {
    throw new BadRequestException(
      'Job description is too long. Please limit to 10,000 characters.',
    );
  }

  const normalizedDescription = trimmedDescription.toLowerCase();
  const jobSignalCount = JOB_SIGNALS.filter((signal) =>
    includesPhrase(normalizedDescription, signal),
  ).length;
  const nonJobSignalCount = NON_JOB_SIGNALS.filter((signal) =>
    includesPhrase(normalizedDescription, signal),
  ).length;

  if (jobSignalCount < 2 || nonJobSignalCount >= 3) {
    throw new BadRequestException(
      'Job description does not look like a job posting. Please provide the actual job description.',
    );
  }
}
