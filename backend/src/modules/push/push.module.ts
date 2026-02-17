import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushToken } from './entities/push-token.entity';
import { PushService } from './push.service';
import { PushController } from './push.controller';
import { FirebaseAdminProvider } from './firebase-admin.provider';

@Module({
  imports: [TypeOrmModule.forFeature([PushToken]), ConfigModule],
  controllers: [PushController],
  providers: [PushService, FirebaseAdminProvider],
  exports: [PushService],
})
export class PushModule {}
