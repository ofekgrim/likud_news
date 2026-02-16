import { PartialType } from '@nestjs/swagger';
import { CreateTickerItemDto } from './create-ticker-item.dto';

export class UpdateTickerItemDto extends PartialType(CreateTickerItemDto) {}
