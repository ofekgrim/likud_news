import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmaSession } from './entities/ama-session.entity';
import { AmaQuestion } from './entities/ama-question.entity';
import { AmaService } from './ama.service';
import { AmaGateway } from './ama.gateway';
import { AmaController } from './ama.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AmaSession, AmaQuestion])],
  providers: [AmaService, AmaGateway],
  controllers: [AmaController],
  exports: [AmaService],
})
export class AmaModule {}
