import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMembershipDto {
  @ApiProperty({ description: 'Likud membership ID number' })
  @IsString()
  @IsNotEmpty()
  membershipId: string;

  @ApiProperty({ description: 'Full name on membership card', required: false })
  @IsOptional()
  @IsString()
  fullName?: string;
}
