import {
  IsOptional,
  IsString,
  ValidateNested,
  IsEmail,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProfileDetailsDto {
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

export class UpdateUserProfileDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProfileDetailsDto)
  profileDetails?: ProfileDetailsDto;
}
