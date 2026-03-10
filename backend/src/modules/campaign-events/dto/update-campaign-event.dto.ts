import { PartialType } from '@nestjs/swagger';
import { CreateCampaignEventDto } from './create-campaign-event.dto';

export class UpdateCampaignEventDto extends PartialType(CreateCampaignEventDto) {}
