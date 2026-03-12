import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeService } from './realtime.service';
import { ResultsGateway } from './results.gateway';
import { RedisPubSubService } from './redis-pubsub.service';

describe('RealtimeService', () => {
  let service: RealtimeService;
  let gateway: {
    broadcastResults: jest.Mock;
    broadcastTurnout: jest.Mock;
    broadcastListUpdate: jest.Mock;
    getConnectionCount: jest.Mock;
  };
  let redisPubSub: {
    publish: jest.Mock;
    subscribe: jest.Mock;
    unsubscribe: jest.Mock;
  };

  beforeEach(async () => {
    gateway = {
      broadcastResults: jest.fn(),
      broadcastTurnout: jest.fn(),
      broadcastListUpdate: jest.fn(),
      getConnectionCount: jest.fn(),
    };

    redisPubSub = {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeService,
        { provide: ResultsGateway, useValue: gateway },
        { provide: RedisPubSubService, useValue: redisPubSub },
      ],
    }).compile();

    service = module.get<RealtimeService>(RealtimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // onModuleInit
  // ---------------------------------------------------------------------------
  describe('onModuleInit', () => {
    it('should subscribe to Redis wildcard channel on init', async () => {
      await service.onModuleInit();

      expect(redisPubSub.subscribe).toHaveBeenCalledWith(
        'election_results:*',
        expect.any(Function),
      );
    });

    it('should route results messages to gateway.broadcastResults', async () => {
      await service.onModuleInit();

      const callback = redisPubSub.subscribe.mock.calls[0][1];
      const message = JSON.stringify({
        electionId: 'e1',
        type: 'results',
        data: [{ candidateId: 'c1', voteCount: 100 }],
      });

      callback(message);

      expect(gateway.broadcastResults).toHaveBeenCalledWith('e1', [
        { candidateId: 'c1', voteCount: 100 },
      ]);
    });

    it('should route turnout messages to gateway.broadcastTurnout', async () => {
      await service.onModuleInit();

      const callback = redisPubSub.subscribe.mock.calls[0][1];
      const message = JSON.stringify({
        electionId: 'e1',
        type: 'turnout',
        data: { percentage: 55.2 },
      });

      callback(message);

      expect(gateway.broadcastTurnout).toHaveBeenCalledWith('e1', {
        percentage: 55.2,
      });
    });

    it('should route listUpdate messages to gateway.broadcastListUpdate', async () => {
      await service.onModuleInit();

      const callback = redisPubSub.subscribe.mock.calls[0][1];
      const message = JSON.stringify({
        electionId: 'e1',
        type: 'listUpdate',
        data: { position: 1 },
      });

      callback(message);

      expect(gateway.broadcastListUpdate).toHaveBeenCalledWith('e1', {
        position: 1,
      });
    });

    it('should not throw on unknown message type', async () => {
      await service.onModuleInit();

      const callback = redisPubSub.subscribe.mock.calls[0][1];
      const message = JSON.stringify({
        electionId: 'e1',
        type: 'unknown',
        data: {},
      });

      expect(() => callback(message)).not.toThrow();
    });

    it('should not throw on malformed JSON', async () => {
      await service.onModuleInit();

      const callback = redisPubSub.subscribe.mock.calls[0][1];

      expect(() => callback('not-json')).not.toThrow();
    });

    it('should skip messages without electionId', async () => {
      await service.onModuleInit();

      const callback = redisPubSub.subscribe.mock.calls[0][1];
      const message = JSON.stringify({ type: 'results', data: {} });

      callback(message);

      expect(gateway.broadcastResults).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // publishResults
  // ---------------------------------------------------------------------------
  describe('publishResults', () => {
    it('should publish results to Redis with correct channel and payload', async () => {
      const electionId = 'election-uuid-1';
      const results = [
        { candidateId: 'c1', voteCount: 500 },
        { candidateId: 'c2', voteCount: 300 },
      ];

      await service.publishResults(electionId, results);

      expect(redisPubSub.publish).toHaveBeenCalledWith(
        `election_results:${electionId}`,
        {
          electionId,
          type: 'results',
          data: results,
        },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // publishTurnout
  // ---------------------------------------------------------------------------
  describe('publishTurnout', () => {
    it('should publish turnout to Redis with correct channel and payload', async () => {
      const electionId = 'election-uuid-1';
      const turnoutData = {
        district: 'Central',
        percentage: 42.5,
        actualVoters: 850,
        eligibleVoters: 2000,
      };

      await service.publishTurnout(electionId, turnoutData);

      expect(redisPubSub.publish).toHaveBeenCalledWith(
        `election_results:${electionId}`,
        {
          electionId,
          type: 'turnout',
          data: turnoutData,
        },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // publishListUpdate
  // ---------------------------------------------------------------------------
  describe('publishListUpdate', () => {
    it('should publish list update to Redis with correct channel and payload', async () => {
      const electionId = 'election-uuid-1';
      const listData = { position: 5, candidateName: 'Test' };

      await service.publishListUpdate(electionId, listData);

      expect(redisPubSub.publish).toHaveBeenCalledWith(
        `election_results:${electionId}`,
        {
          electionId,
          type: 'listUpdate',
          data: listData,
        },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getConnectionCount
  // ---------------------------------------------------------------------------
  describe('getConnectionCount', () => {
    it('should delegate to gateway.getConnectionCount with electionId', () => {
      gateway.getConnectionCount.mockReturnValue(5);

      const count = service.getConnectionCount('election-uuid-1');

      expect(gateway.getConnectionCount).toHaveBeenCalledWith(
        'election-uuid-1',
      );
      expect(count).toBe(5);
    });

    it('should delegate to gateway.getConnectionCount without electionId', () => {
      gateway.getConnectionCount.mockReturnValue(10);

      const count = service.getConnectionCount();

      expect(gateway.getConnectionCount).toHaveBeenCalledWith(undefined);
      expect(count).toBe(10);
    });
  });
});
