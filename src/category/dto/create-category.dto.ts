import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Seeds' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'seeds' })
  @IsString()
  slug: string;
}
