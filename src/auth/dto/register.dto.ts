import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const PERSON_NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]*[A-Za-z]$|^[A-Za-z]$/;
const PHONE_NUMBER_PATTERN = /^\+[1-9]\d{7,14}$/;

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongPassword123', minLength: 6 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 50)
  @Matches(PERSON_NAME_PATTERN, {
    message:
      'firstName may only contain letters, spaces, apostrophes, and hyphens',
  })
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 50)
  @Matches(PERSON_NAME_PATTERN, {
    message:
      'secondName may only contain letters, spaces, apostrophes, and hyphens',
  })
  secondName?: string;

  @ApiProperty({ example: '+15551234567', required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(PHONE_NUMBER_PATTERN, {
    message:
      'phoneNumber must be a valid international phone number in E.164 format',
  })
  phoneNumber?: string;

  @ApiProperty({ example: '221B Baker Street, London', required: false })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(10, 200)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'address must include both letters and numbers',
  })
  address?: string;
}
