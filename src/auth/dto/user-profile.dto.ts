import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John', required: false, nullable: true })
  firstName: string | null;

  @ApiProperty({ example: 'Doe', required: false, nullable: true })
  secondName: string | null;

  @ApiProperty({ example: '+15551234567', required: false, nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ example: '221B Baker Street, London', required: false, nullable: true })
  address: string | null;

  @ApiProperty({ example: 'USER', enum: ['USER', 'ADMIN'] })
  role: string;

  @ApiProperty({ example: '2026-03-22T10:00:00.000Z' })
  createdAt: Date;
}
