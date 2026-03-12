import { IsUUID, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordCheckinDto {
  @ApiProperty({ description: 'Election UUID' })
  @IsUUID()
  electionId: string;

  @ApiProperty({ description: 'User latitude', example: 32.0853 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'User longitude', example: 34.7818 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
