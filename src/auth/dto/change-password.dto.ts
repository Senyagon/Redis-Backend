import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldStrongPassword123', minLength: 6 })
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @ApiProperty({ example: 'newStrongPassword456', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
