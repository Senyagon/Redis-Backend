import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ProductCategoryDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Seeds' })
  name: string;

  @ApiProperty({ example: 'seeds' })
  slug: string;
}

export class ProductResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Tomato Seeds' })
  name: string;

  @ApiProperty({ example: 'tomato-seeds' })
  slug: string;

  @ApiPropertyOptional({ example: 'Best seeds for your garden' })
  description?: string;

  @ApiProperty({ example: 100 })
  price: number;

  @ApiProperty({ example: 1 })
  categoryId: number;

  @ApiPropertyOptional({ example: '/uploads/1711111111-tomato.webp' })
  image?: string;

  @ApiProperty({ example: '2026-03-22T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: ProductCategoryDto })
  category: ProductCategoryDto;
}
