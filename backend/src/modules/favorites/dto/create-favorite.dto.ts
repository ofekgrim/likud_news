import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({ description: 'Device identifier', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ description: 'Article UUID to favorite' })
  @IsUUID()
  articleId: string;

  @ApiProperty({ description: 'Authenticated user ID', required: false })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: 'Bookmark folder ID', required: false })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiProperty({ description: 'Note for this bookmark', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
