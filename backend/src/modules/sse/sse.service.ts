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
  private readonly primariesSubject = new Subject<MessageEvent>();

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

  emitPrimaries(data: object | string): void {
    this.primariesSubject.next({ data });
  }

  getPrimariesStream(): Observable<MessageEvent> {
    return this.primariesSubject.asObservable().pipe(
      map((event) => ({
        data: event.data,
        type: 'primaries',
      })),
    );
  }

  private readonly articlesSubject = new Subject<MessageEvent>();

  emitNewArticle(data: object | string): void {
    this.articlesSubject.next({ data });
  }

  getArticlesStream(): Observable<MessageEvent> {
    return this.articlesSubject.asObservable().pipe(
      map((event) => ({
        data: event.data,
        type: 'new_article',
      })),
    );
  }

  // Feed updates stream
  private readonly feedSubject = new Subject<MessageEvent>();

  /**
   * Emit a feed update event.
   * @param data - The feed item data (article, poll, event, election, quiz)
   * @param type - The type of update (new_article, new_poll, new_event, etc.)
   */
  emitFeedUpdate(data: object | string, type?: string): void {
    this.feedSubject.next({ data, type });
  }

  /**
   * Get the feed updates stream.
   * Clients subscribe to this to receive real-time feed updates.
   */
  getFeedStream(): Observable<MessageEvent> {
    return this.feedSubject.asObservable().pipe(
      map((event) => ({
        data: event.data,
        type: event.type || 'feed_update',
      })),
    );
  }
}
