import { IsString, IsOptional, IsArray, IsUUID, IsObject, IsEmail, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ description: 'Display name', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ description: 'User bio', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\-\s]{7,15}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiProperty({ description: 'Email address', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @ApiProperty({ description: 'Preferred category IDs', required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  preferredCategories?: string[];

  @ApiProperty({ description: 'Notification preferences', required: false })
  @IsOptional()
  @IsObject()
  notificationPrefs?: Record<string, unknown>;
}
