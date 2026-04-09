import {
  IsOptional,
  IsString,
  IsNotEmpty,
  ValidateIf,
  IsEnum,
  MaxLength,
  IsUrl,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { InputType } from 'src/common/enums/input-type.enum';

const trimTransform = ({ value }: { value?: string }) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
};

export class CreateJobDto {
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  companyName?: string;

  @IsEnum(InputType)
  @IsNotEmpty()
  inputType?: InputType;

  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsOptional()
  jobTitle?: string;

  @Transform(trimTransform)
  @ValidateIf((o: CreateJobDto) => o.inputType === InputType.LINK)
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  jobLink?: string;

  @Transform(trimTransform)
  @ValidateIf((o: CreateJobDto) => o.inputType === InputType.TEXT)
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  jobText?: string;
}
