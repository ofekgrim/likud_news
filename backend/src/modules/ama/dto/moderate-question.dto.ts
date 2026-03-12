import { IsEnum } from 'class-validator';

export enum ModerateAction {
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class ModerateQuestionDto {
  @IsEnum(ModerateAction)
  status: ModerateAction;
}
