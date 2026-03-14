import { Module } from '@nestjs/common';
import { LegalController } from './legal.controller';
import { WellKnownController } from './well-known.controller';

@Module({
  controllers: [LegalController, WellKnownController],
})
export class LegalModule {}
