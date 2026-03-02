import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginEmailDto {
  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Device identifier for token binding' })
  @IsString()
  deviceId: string;

  @ApiProperty({ description: 'Platform', required: false })
  @IsOptional()
  @IsString()
  platform?: string;
}
