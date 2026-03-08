import {
  IsString,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class AudienceRulesDto {
  @IsEnum(['all', 'targeted', 'specific_users'])
  type: 'all' | 'targeted' | 'specific_users';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  membershipStatuses?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeUserIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @IsString()
  notificationPrefKey?: string;
}
