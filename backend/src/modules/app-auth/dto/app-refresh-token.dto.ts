import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppRefreshTokenDto {
  @ApiProperty({ description: 'Refresh token string' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({ description: 'Device identifier' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
