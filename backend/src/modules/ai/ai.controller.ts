import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Sse,
  MessageEvent,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable, Subject } from 'rxjs';
import { ChatService } from './chat.service';
import { SummarizationService } from './summarization.service';
import { EmbeddingService } from './embedding.service';
import { AiQuizGeneratorService } from './ai-quiz-generator.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatFeedbackDto } from './dto/chat-feedback.dto';
import { SummarizeQueryDto } from './dto/summarize-query.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly summarizationService: SummarizationService,
    private readonly embeddingService: EmbeddingService,
    private readonly aiQuizGeneratorService: AiQuizGeneratorService,
  ) {}

  // ── Static routes FIRST ──────────────────────────────────────────────

  @Post('chat')
  @ApiOperation({ summary: 'Send a chat message and get AI reply' })
  async chat(@Body() dto: ChatMessageDto) {
    let sessionId = dto.sessionId;

    if (!sessionId) {
      const session = await this.chatService.createSession(
        dto.appUserId,
        dto.deviceId,
      );
      sessionId = session.id;
    }

    const reply = await this.chatService.chat(sessionId, dto.message);

    return {
      data: { sessionId, reply },
      meta: null,
      error: null,
    };
  }

  @Post('chat/stream')
  @Sse()
  @ApiOperation({ summary: 'Stream a chat reply via SSE' })
  chatStream(@Body() dto: ChatMessageDto): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    (async () => {
      try {
        let sessionId = dto.sessionId;

        if (!sessionId) {
          const session = await this.chatService.createSession(
            dto.appUserId,
            dto.deviceId,
          );
          sessionId = session.id;
        }

        const reply = await this.chatService.chat(sessionId, dto.message);

        // Stream the reply in chunks
        const chunkSize = 50;
        for (let i = 0; i < reply.length; i += chunkSize) {
          subject.next({
            data: {
              sessionId,
              chunk: reply.slice(i, i + chunkSize),
              done: i + chunkSize >= reply.length,
            },
          });
        }

        subject.complete();
      } catch (error) {
        subject.next({
          data: {
            error: error.message || 'Chat stream failed',
            done: true,
          },
        });
        subject.complete();
      }
    })();

    return subject.asObservable();
  }

  @Post('quiz/generate')
  @ApiOperation({ summary: 'Admin: trigger AI quiz generation' })
  async generateQuiz() {
    const questions = await this.aiQuizGeneratorService.generateDailyQuiz();
    return {
      data: questions,
      meta: { count: questions.length },
      error: null,
    };
  }

  @Post('embeddings/batch')
  @ApiOperation({ summary: 'Admin: embed all unembedded articles' })
  async embedBatch() {
    await this.embeddingService.embedAllArticles();
    return {
      data: { status: 'batch embedding started' },
      meta: null,
      error: null,
    };
  }

  // ── Dynamic routes AFTER ─────────────────────────────────────────────

  @Get('chat/sessions/:sessionId')
  @ApiOperation({ summary: 'Get chat session with messages' })
  async getSession(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    const session = await this.chatService.getSession(sessionId);
    return {
      data: session,
      meta: null,
      error: null,
    };
  }

  @Post('chat/sessions/:sessionId/feedback')
  @ApiOperation({ summary: 'Provide feedback on a chat session' })
  async provideFeedback(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: ChatFeedbackDto,
  ) {
    const session = await this.chatService.provideFeedback(
      sessionId,
      dto.feedback,
    );
    return {
      data: session,
      meta: null,
      error: null,
    };
  }

  @Get('summarize/:articleId')
  @ApiOperation({ summary: 'Get or generate an AI summary for an article' })
  async summarize(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Query() _query: SummarizeQueryDto,
  ) {
    const summary =
      await this.summarizationService.summarizeArticle(articleId);
    return {
      data: summary,
      meta: null,
      error: null,
    };
  }

  @Post('embeddings/article/:articleId')
  @ApiOperation({ summary: 'Admin: embed a single article' })
  async embedArticle(
    @Param('articleId', ParseUUIDPipe) articleId: string,
  ) {
    await this.embeddingService.embedArticle(articleId);
    return {
      data: { status: 'embedded', articleId },
      meta: null,
      error: null,
    };
  }
}
