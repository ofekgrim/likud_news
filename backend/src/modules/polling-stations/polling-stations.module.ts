import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PollingStation } from './entities/polling-station.entity';
import { StationReport } from './entities/station-report.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { PollingStationsService } from './polling-stations.service';
import { PollingStationsController } from './polling-stations.controller';
import { AppAuthModule } from '../app-auth/app-auth.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PollingStation, StationReport, PrimaryElection]),
    AppAuthModule,
    AuthModule,
  ],
  controllers: [PollingStationsController],
  providers: [PollingStationsService],
  exports: [PollingStationsService],
})
export class PollingStationsModule {}
