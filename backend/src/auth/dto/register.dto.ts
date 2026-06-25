import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trimTransform = ({ value }: { value?: string }) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  return value;
};

export class RegisterDto {
  @Transform(trimTransform)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
