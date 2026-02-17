import {
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationDataDto {
  @ApiPropertyOptional({
    example: 'article-slug-123',
    description: 'Article slug for deep linking',
  })
  @IsOptional()
  @IsString()
  articleSlug?: string;

  @ApiPropertyOptional({
    example: 'breaking',
    description: 'Notification type',
  })
  @IsOptional()
  @IsString()
  type?: string;
}

export class SendNotificationDto {
  @ApiProperty({ example: 'Breaking News', description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Major event just happened',
    description: 'Notification body',
  })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/image.jpg',
    description: 'Image URL for rich notification',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional notification data',
    type: NotificationDataDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NotificationDataDto)
  data?: NotificationDataDto;
}
