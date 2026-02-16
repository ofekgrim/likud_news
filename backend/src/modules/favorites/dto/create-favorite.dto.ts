import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({ description: 'Device identifier', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ description: 'Article UUID to favorite' })
  @IsUUID()
  articleId: string;
}
