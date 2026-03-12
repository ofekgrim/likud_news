import { IsString, IsOptional, IsEmail, IsUrl, IsBoolean } from 'class-validator';

export class CreateCompanyAdvertiserDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
