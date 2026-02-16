import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TickerItem } from './entities/ticker-item.entity';
import { TickerService } from './ticker.service';
import { TickerController } from './ticker.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TickerItem])],
  controllers: [TickerController],
  providers: [TickerService],
  exports: [TickerService],
})
export class TickerModule {}
