import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class VotePollDto {
  @ApiProperty({ description: 'Index of the selected option (0-based)', minimum: 0 })
  @IsNumber()
  @Min(0)
  optionIndex: number;
}
