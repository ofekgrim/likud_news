import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResultsGateway } from './results.gateway';
import { RedisPubSubService } from './redis-pubsub.service';
import { RealtimeService } from './realtime.service';
import { ElectionResultsModule } from '../election-results/election-results.module';

@Module({
  imports: [ConfigModule, ElectionResultsModule],
  providers: [ResultsGateway, RedisPubSubService, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
