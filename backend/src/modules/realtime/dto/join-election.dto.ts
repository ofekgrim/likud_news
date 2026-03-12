import { IsUUID } from 'class-validator';

export class JoinElectionDto {
  @IsUUID()
  electionId: string;
}
