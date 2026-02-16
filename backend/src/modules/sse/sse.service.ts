import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Injectable()
export class SseService {
  private readonly tickerSubject = new Subject<MessageEvent>();
  private readonly breakingSubject = new Subject<MessageEvent>();

  emitTicker(data: object | string): void {
    this.tickerSubject.next({ data });
  }

  emitBreaking(data: object | string): void {
    this.breakingSubject.next({ data });
  }

  getTickerStream(): Observable<MessageEvent> {
    return this.tickerSubject.asObservable().pipe(
      map((event) => ({
        data: event.data,
        type: 'ticker',
      })),
    );
  }

  getBreakingStream(): Observable<MessageEvent> {
    return this.breakingSubject.asObservable().pipe(
      map((event) => ({
        data: event.data,
        type: 'breaking',
      })),
    );
  }
}
