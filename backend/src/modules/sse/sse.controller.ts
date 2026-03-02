import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SseService } from './sse.service';

@ApiTags('SSE')
@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('ticker')
  @ApiOperation({ summary: 'Subscribe to ticker item updates via SSE' })
  ticker(): Observable<MessageEvent> {
    return this.sseService.getTickerStream();
  }

  @Sse('breaking')
  @ApiOperation({ summary: 'Subscribe to breaking news updates via SSE' })
  breaking(): Observable<MessageEvent> {
    return this.sseService.getBreakingStream();
  }

  @Sse('primaries')
  @ApiOperation({ summary: 'Subscribe to primaries updates via SSE (results, turnout)' })
  primaries(): Observable<MessageEvent> {
    return this.sseService.getPrimariesStream();
  }

  @Sse('articles')
  @ApiOperation({ summary: 'Subscribe to new article notifications via SSE' })
  articles(): Observable<MessageEvent> {
    return this.sseService.getArticlesStream();
  }

  @Sse('feed')
  @ApiOperation({
    summary: 'Subscribe to unified feed updates via SSE',
    description:
      'Receives real-time notifications when new content is published ' +
      '(articles, polls, events, election updates, quizzes). ' +
      'Event types: new_article, new_poll, new_event, election_update, quiz_update',
  })
  feed(): Observable<MessageEvent> {
    return this.sseService.getFeedStream();
  }
}
