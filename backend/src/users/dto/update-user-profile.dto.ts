import {
  IsOptional,
  IsString,
  ValidateNested,
  IsEmail,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

// Personal information
export class PersonalInfoDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

// Individual experience/job entry
export class ExperienceDto {
  @IsOptional()
  @IsString()
  currentPosition?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  currentlyWorking?: boolean;

  [key: string]: any;
}

export class EducationDto {
  @IsOptional()
  @IsString()
  instituteName?: string;

  @IsOptional()
  @IsString()
  degreeName?: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  currentlyAttending?: boolean;

  @IsOptional()
  @IsString()
  gradeCgpa?: string;

  @IsOptional()
  @IsString()
  description?: string;

  [key: string]: any;
}

// Overall profile update DTO
export class UpdateProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalInfoDto)
  personalInfo?: PersonalInfoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experiences?: ExperienceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  educations?: EducationDto[];

  [key: string]: any;
}
