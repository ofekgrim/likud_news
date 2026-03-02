import { PartialType } from '@nestjs/swagger';
import { CreatePollingStationDto } from './create-polling-station.dto';

export class UpdatePollingStationDto extends PartialType(CreatePollingStationDto) {}
