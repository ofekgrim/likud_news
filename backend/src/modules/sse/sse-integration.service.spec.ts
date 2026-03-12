import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, take, toArray, Subscription } from 'rxjs';
import { SseService, MessageEvent } from './sse.service';

describe('SseService (integration)', () => {
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

  // ---------------------------------------------------------------------------
  // Ticker stream
  // ---------------------------------------------------------------------------
  describe('getTickerStream', () => {
    it('should return an Observable', () => {
      const stream = service.getTickerStream();
      expect(stream).toBeDefined();
      expect(typeof stream.subscribe).toBe('function');
    });

    it('should emit data passed via emitTicker', async () => {
      const payload = { headline: 'Breaking news ticker' };
      const eventPromise = firstValueFrom(service.getTickerStream().pipe(take(1)));

      service.emitTicker(payload);

      const event = await eventPromise;
      expect(event.data).toEqual(payload);
      expect(event.type).toBe('ticker');
    });
  });

  // ---------------------------------------------------------------------------
  // Station wait stream
  // ---------------------------------------------------------------------------
  describe('getStationWaitStream', () => {
    it('should return an Observable', () => {
      const stream = service.getStationWaitStream();
      expect(stream).toBeDefined();
      expect(typeof stream.subscribe).toBe('function');
    });

    it('should deliver station wait data to subscribers', async () => {
      const stationData = {
        stationId: 'station-42',
        avgWaitMinutes: 12.5,
        trafficLight: 'yellow',
        reportCount: 7,
      };

      const eventPromise = firstValueFrom(
        service.getStationWaitStream().pipe(take(1)),
      );

      service.emitStationWaitUpdate(stationData);

      const event = await eventPromise;
      expect(event.data).toEqual(stationData);
      expect(event.type).toBe('station_wait_update');
    });
  });

  // ---------------------------------------------------------------------------
  // Multiple simultaneous subscribers
  // ---------------------------------------------------------------------------
  describe('multiple simultaneous subscribers', () => {
    it('should deliver the same ticker event to all subscribers', async () => {
      const payload = { headline: 'shared ticker' };

      const sub1Promise = firstValueFrom(service.getTickerStream().pipe(take(1)));
      const sub2Promise = firstValueFrom(service.getTickerStream().pipe(take(1)));
      const sub3Promise = firstValueFrom(service.getTickerStream().pipe(take(1)));

      service.emitTicker(payload);

      const [ev1, ev2, ev3] = await Promise.all([sub1Promise, sub2Promise, sub3Promise]);

      expect(ev1.data).toEqual(payload);
      expect(ev2.data).toEqual(payload);
      expect(ev3.data).toEqual(payload);
    });

    it('should deliver the same station wait event to all subscribers', async () => {
      const stationData = {
        stationId: 'station-99',
        avgWaitMinutes: 5,
        trafficLight: 'green',
        reportCount: 2,
      };

      const sub1Promise = firstValueFrom(service.getStationWaitStream().pipe(take(1)));
      const sub2Promise = firstValueFrom(service.getStationWaitStream().pipe(take(1)));

      service.emitStationWaitUpdate(stationData);

      const [ev1, ev2] = await Promise.all([sub1Promise, sub2Promise]);

      expect(ev1.data).toEqual(stationData);
      expect(ev2.data).toEqual(stationData);
    });
  });

  // ---------------------------------------------------------------------------
  // Subscriber disconnect
  // ---------------------------------------------------------------------------
  describe('subscriber disconnect', () => {
    it('should not error when a subscriber disconnects and stream continues for others', async () => {
      const received: MessageEvent[] = [];
      let subscription: Subscription | undefined;

      // Sub1 subscribes and immediately unsubscribes (simulates disconnect)
      subscription = service.getTickerStream().subscribe((event) => {
        received.push(event);
      });
      subscription.unsubscribe();

      // Sub2 stays active
      const sub2Promise = firstValueFrom(service.getTickerStream().pipe(take(1)));

      // Emit after sub1 has disconnected
      service.emitTicker({ headline: 'after disconnect' });

      const event = await sub2Promise;

      // Sub2 should receive the event
      expect(event.data).toEqual({ headline: 'after disconnect' });
      expect(event.type).toBe('ticker');

      // Sub1 should NOT have received any events (already unsubscribed)
      expect(received).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Rapid emission
  // ---------------------------------------------------------------------------
  describe('rapid emission', () => {
    it('should deliver 100 events in order to a subscriber', async () => {
      const count = 100;

      const collectPromise = firstValueFrom(
        service.getTickerStream().pipe(take(count), toArray()),
      );

      for (let i = 0; i < count; i++) {
        service.emitTicker({ index: i });
      }

      const events = await collectPromise;

      expect(events).toHaveLength(count);
      for (let i = 0; i < count; i++) {
        expect(events[i].data).toEqual({ index: i });
        expect(events[i].type).toBe('ticker');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Empty/null data
  // ---------------------------------------------------------------------------
  describe('empty/null data handling', () => {
    it('should handle empty object data gracefully', async () => {
      const eventPromise = firstValueFrom(service.getTickerStream().pipe(take(1)));

      service.emitTicker({});

      const event = await eventPromise;
      expect(event.data).toEqual({});
      expect(event.type).toBe('ticker');
    });

    it('should handle empty string data gracefully', async () => {
      const eventPromise = firstValueFrom(service.getTickerStream().pipe(take(1)));

      service.emitTicker('');

      const event = await eventPromise;
      expect(event.data).toBe('');
      expect(event.type).toBe('ticker');
    });

    it('should handle station wait with empty object gracefully', async () => {
      const eventPromise = firstValueFrom(
        service.getStationWaitStream().pipe(take(1)),
      );

      service.emitStationWaitUpdate({});

      const event = await eventPromise;
      expect(event.data).toEqual({});
      expect(event.type).toBe('station_wait_update');
    });
  });
});
