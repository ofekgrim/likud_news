import { PartialType } from '@nestjs/swagger';
import { CreateAmaSessionDto } from './create-ama-session.dto';

export class UpdateAmaSessionDto extends PartialType(CreateAmaSessionDto) {}
