import { ApiProperty } from '@nestjs/swagger';

export class ImageUploadResponseDto {
  @ApiProperty({ example: '/uploads/1711111111-123456789.webp' })
  imageUrl: string;
}
