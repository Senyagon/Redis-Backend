import { IsInt, IsString, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Tomato Seeds' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'tomato-seeds' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  price: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  categoryId: number;

  @ApiPropertyOptional({ example: 'Best seeds for your garden' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;
}