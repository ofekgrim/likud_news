import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Transform } from 'class-transformer';

export class CompareCandidatesDto {
  @ApiProperty({
    description:
      'Comma-separated candidate UUIDs (2-4). Passed as query param: ?ids=uuid1,uuid2',
    example: 'uuid1,uuid2',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((s) => s.trim()) : value,
  )
  @IsArray()
  @ArrayMinSize(2, { message: 'At least 2 candidate IDs are required for comparison' })
  @ArrayMaxSize(4, { message: 'At most 4 candidate IDs can be compared at once' })
  @IsUUID('4', { each: true, message: 'Each ID must be a valid UUID' })
  ids: string[];
}
