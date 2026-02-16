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
}
