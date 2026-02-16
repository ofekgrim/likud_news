import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresignUploadDto {
  @ApiProperty({ example: 'photo.jpg', description: 'Original filename' })
  @IsString()
  filename: string;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the file' })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({ example: 1024000, description: 'File size in bytes' })
  @IsOptional()
  @IsNumber()
  size?: number;
}
