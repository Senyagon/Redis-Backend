import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductSearchSuggestionDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Tomato Seeds' })
  name: string;

  @ApiProperty({ example: 'tomato-seeds' })
  slug: string;

  @ApiPropertyOptional({ example: '/uploads/1711111111-tomato.webp' })
  image?: string | null;
}
