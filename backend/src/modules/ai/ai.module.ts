import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ArticleAiSummary } from './entities/article-ai-summary.entity';
import { ChatbotSession } from './entities/chatbot-session.entity';
import { ArticleEmbedding } from './entities/article-embedding.entity';
import { Article } from '../articles/entities/article.entity';
import { ChatService } from './chat.service';
import { RagService } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { SummarizationService } from './summarization.service';
import { AiQuizGeneratorService } from './ai-quiz-generator.service';
import { AiController } from './ai.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ArticleAiSummary,
      ChatbotSession,
      ArticleEmbedding,
      Article,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [AiController],
  providers: [
    ChatService,
    RagService,
    EmbeddingService,
    SummarizationService,
    AiQuizGeneratorService,
  ],
  exports: [ChatService, SummarizationService],
})
export class AiModule {}
