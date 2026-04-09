import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { InputType } from 'src/common/enums/input-type.enum';

interface JobInputDto {
  inputType?: InputType;
  jobLink?: string | null;
  jobText?: string | null;
}

@Injectable()
export class ValidateJobInputPipe implements PipeTransform<
  unknown,
  JobInputDto
> {
  transform(value: unknown, metadata: ArgumentMetadata): JobInputDto {
    if (metadata.type !== 'body') {
      return value as JobInputDto;
    }

    // Guard: Ensure value is an object
    if (
      value === null ||
      value === undefined ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      throw new BadRequestException('Request body must be a valid JSON object');
    }

    const dto = value as JobInputDto;

    if (!dto.inputType) {
      throw new BadRequestException('inputType is required');
    }

    if (dto.inputType === InputType.LINK) {
      const hasJobLink =
        dto.jobLink !== null &&
        dto.jobLink !== undefined &&
        dto.jobLink.length > 0;
      const noJobText = dto.jobText === null || dto.jobText === undefined;

      if (!hasJobLink || !noJobText) {
        throw new BadRequestException(
          'When inputType is LINK, jobLink must not be empty and jobText must be null',
        );
      }
    } else if (dto.inputType === InputType.TEXT) {
      const hasJobText =
        dto.jobText !== null &&
        dto.jobText !== undefined &&
        dto.jobText.length > 0;
      const noJobLink = dto.jobLink === null || dto.jobLink === undefined;

      if (!hasJobText || !noJobLink) {
        throw new BadRequestException(
          'When inputType is TEXT, jobText must not be empty and jobLink must be null',
        );
      }
    } else {
      throw new BadRequestException('inputType must be either LINK or TEXT');
    }

    return value as JobInputDto;
  }
}
