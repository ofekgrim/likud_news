import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignMemberDto {
  @ApiProperty({ description: 'Branch UUID to assign the user to' })
  @IsUUID()
  branchId: string;
}
