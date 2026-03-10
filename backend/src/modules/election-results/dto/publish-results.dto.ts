import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsOptional } from 'class-validator';

export class PublishResultsDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;

  @ApiProperty({ description: 'Whether results are official', default: false })
  @IsOptional()
  @IsBoolean()
  isOfficial?: boolean = false;
}
