import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, take } from 'rxjs';
import { SseService } from './sse.service';

describe('SseService', () => {
  let service: SseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SseService],
    }).compile();

    service = module.get<SseService>(SseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ticker stream', () => {
    it('should emit data with type "ticker"', async () => {
      const payload = { headline: 'מבזק חדשות' };

      const eventPromise = firstValueFrom(
        service.getTickerStream().pipe(take(1)),
      );

      service.emitTicker(payload);

      const event = await eventPromise;
      expect(event.data).toEqual(payload);
      expect(event.type).toBe('ticker');
    });
  });

  describe('breaking stream', () => {
    it('should emit data with type "breaking"', async () => {
      const payload = { title: 'חדשות דחופות' };

      const eventPromise = firstValueFrom(
        service.getBreakingStream().pipe(take(1)),
      );

      service.emitBreaking(payload);

      const event = await eventPromise;
      expect(event.data).toEqual(payload);
      expect(event.type).toBe('breaking');
    });
  });

  describe('primaries stream', () => {
    it('should emit data with type "primaries"', async () => {
      const payload = { candidateId: '1', votes: 1200 };

      const eventPromise = firstValueFrom(
        service.getPrimariesStream().pipe(take(1)),
      );

      service.emitPrimaries(payload);

      const event = await eventPromise;
      expect(event.data).toEqual(payload);
      expect(event.type).toBe('primaries');
    });
  });

  describe('articles stream', () => {
    it('should emit data with type "new_article"', async () => {
      const payload = { id: 'article-1', title: 'כתבה חדשה' };

      const eventPromise = firstValueFrom(
        service.getArticlesStream().pipe(take(1)),
      );

      service.emitNewArticle(payload);

      const event = await eventPromise;
      expect(event.data).toEqual(payload);
      expect(event.type).toBe('new_article');
    });
  });

  describe('station wait stream', () => {
    it('should emit data with type "station_wait_update"', async () => {
      const payload = {
        stationId: 'station-1',
        avgWaitMinutes: 15.5,
        trafficLight: 'yellow',
        reportCount: 4,
      };

      const eventPromise = firstValueFrom(
        service.getStationWaitStream().pipe(take(1)),
      );

      service.emitStationWaitUpdate(payload);

      const event = await eventPromise;
      expect(event.data).toEqual(payload);
      expect(event.type).toBe('station_wait_update');
    });
  });

  describe('feed stream', () => {
    it('should default to type "feed_update" when no type provided', async () => {
      const payload = { itemId: 'feed-1' };

      const eventPromise = firstValueFrom(
        service.getFeedStream().pipe(take(1)),
      );

      service.emitFeedUpdate(payload);

      const event = await eventPromise;
      expect(event.data).toEqual(payload);
      expect(event.type).toBe('feed_update');
    });

    it('should use custom type when provided', async () => {
      const payload = { pollId: 'poll-1', question: 'סקר חדש' };

      const eventPromise = firstValueFrom(
        service.getFeedStream().pipe(take(1)),
      );

      service.emitFeedUpdate(payload, 'new_poll');

      const event = await eventPromise;
      expect(event.data).toEqual(payload);
      expect(event.type).toBe('new_poll');
    });
  });

  describe('multiple subscribers', () => {
    it('should deliver the same event to all subscribers', async () => {
      const payload = { headline: 'שני מנויים' };

      const firstSubscriber = firstValueFrom(
        service.getTickerStream().pipe(take(1)),
      );
      const secondSubscriber = firstValueFrom(
        service.getTickerStream().pipe(take(1)),
      );

      service.emitTicker(payload);

      const [first, second] = await Promise.all([
        firstSubscriber,
        secondSubscriber,
      ]);

      expect(first.data).toEqual(payload);
      expect(first.type).toBe('ticker');
      expect(second.data).toEqual(payload);
      expect(second.type).toBe('ticker');
    });
  });
});
