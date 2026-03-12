import { IsUUID } from 'class-validator';

export class RecordClickDto {
  @IsUUID()
  placementId: string;
}
