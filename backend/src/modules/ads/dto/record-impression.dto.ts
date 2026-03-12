import { IsUUID } from 'class-validator';

export class RecordImpressionDto {
  @IsUUID()
  placementId: string;
}
