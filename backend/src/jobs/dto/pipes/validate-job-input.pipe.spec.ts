import { ArgumentMetadata, BadRequestException } from '@nestjs/common';

import { InputType } from '../../../common/enums/input-type.enum';
import { ValidateJobInputPipe } from './validate-job-input.pipe';

describe('ValidateJobInputPipe', () => {
  let pipe: ValidateJobInputPipe;
  const bodyMetadata: ArgumentMetadata = {
    type: 'body',
    metatype: undefined,
    data: undefined,
  };

  beforeEach(() => {
    pipe = new ValidateJobInputPipe();
  });

  it('allows TEXT input with jobText only', () => {
    const payload = {
      inputType: InputType.TEXT,
      jobText: 'A detailed backend engineer job description.',
    };

    expect(pipe.transform(payload, bodyMetadata)).toBe(payload);
  });

  it('allows LINK input with jobLink only', () => {
    const payload = {
      inputType: InputType.LINK,
      jobLink: 'https://example.com/jobs/backend-engineer',
    };

    expect(pipe.transform(payload, bodyMetadata)).toBe(payload);
  });

  it('rejects TEXT input when both jobText and jobLink are provided', () => {
    expect(() =>
      pipe.transform(
        {
          inputType: InputType.TEXT,
          jobText: 'A detailed backend engineer job description.',
          jobLink: 'https://example.com/jobs/backend-engineer',
        },
        bodyMetadata,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects LINK input when both jobLink and jobText are provided', () => {
    expect(() =>
      pipe.transform(
        {
          inputType: InputType.LINK,
          jobLink: 'https://example.com/jobs/backend-engineer',
          jobText: 'A detailed backend engineer job description.',
        },
        bodyMetadata,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects TEXT input when neither jobText nor jobLink is provided', () => {
    expect(() =>
      pipe.transform({ inputType: InputType.TEXT }, bodyMetadata),
    ).toThrow(BadRequestException);
  });

  it('rejects LINK input when neither jobLink nor jobText is provided', () => {
    expect(() =>
      pipe.transform({ inputType: InputType.LINK }, bodyMetadata),
    ).toThrow(BadRequestException);
  });

  it('rejects missing inputType', () => {
    expect(() => pipe.transform({}, bodyMetadata)).toThrow(BadRequestException);
  });

  it('rejects invalid inputType', () => {
    expect(() =>
      pipe.transform(
        { inputType: 'EMAIL', jobText: 'Invalid type' },
        bodyMetadata,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects a non-object request body', () => {
    expect(() => pipe.transform(null, bodyMetadata)).toThrow(
      BadRequestException,
    );
    expect(() => pipe.transform([], bodyMetadata)).toThrow(BadRequestException);
  });

  it('passes non-body metadata through unchanged', () => {
    const payload = 'not a body';

    expect(
      pipe.transform(payload, {
        type: 'query',
        metatype: undefined,
        data: undefined,
      }),
    ).toBe(payload);
  });
});
