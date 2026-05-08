import {
  IsOptional,
  IsString,
  ValidateNested,
  IsEmail,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

// Update DTOs - all fields optional for flexible updates
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

// Create DTOs - for new profile creation
export class CreatePersonalInfoDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateExperienceDto {
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

export class CreateProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePersonalInfoDto)
  personalInfo?: CreatePersonalInfoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExperienceDto)
  experiences?: CreateExperienceDto[];

  [key: string]: any;
}
