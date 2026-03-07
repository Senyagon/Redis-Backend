import { IsInt, IsString, Min, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsInt()
  @Min(1)
  price: number;

  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsString()
  description?: string;
}