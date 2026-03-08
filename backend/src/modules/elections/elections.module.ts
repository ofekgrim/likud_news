import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrimaryElection } from './entities/primary-election.entity';
import { ElectionsService } from './elections.service';
import { ElectionsController } from './elections.controller';
import { AuthModule } from '../auth/auth.module';
import { SseModule } from '../sse/sse.module';
import { ElectionResultsModule } from '../election-results/election-results.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PrimaryElection]),
    AuthModule,
    SseModule,
    NotificationsModule,
    forwardRef(() => ElectionResultsModule),
  ],
  controllers: [ElectionsController],
  providers: [ElectionsService],
  exports: [ElectionsService],
})
export class ElectionsModule {}
