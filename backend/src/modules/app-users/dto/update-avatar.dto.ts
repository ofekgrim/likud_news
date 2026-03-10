import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvatarDto {
  @ApiProperty({ description: 'Avatar image URL (S3)' })
  @IsString()
  @IsNotEmpty()
  avatarUrl: string;
}
