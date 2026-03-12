import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeService } from './realtime.service';
import { ResultsGateway } from './results.gateway';
import { RedisPubSubService } from './redis-pubsub.service';

describe('RealtimeService (integration)', () => {
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
      getConnectionCount: jest.fn().mockReturnValue(0),
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
  // publishResults
  // ---------------------------------------------------------------------------
  describe('publishResults', () => {
    it('should call RedisPubSub.publish with correct channel and data', async () => {
      const electionId = 'election-uuid-1';
      const results = [
        { candidateId: 'c1', voteCount: 500 },
        { candidateId: 'c2', voteCount: 300 },
      ];

      await service.publishResults(electionId, results);

      expect(redisPubSub.publish).toHaveBeenCalledTimes(1);
      expect(redisPubSub.publish).toHaveBeenCalledWith(
        `election_results:${electionId}`,
        {
          electionId,
          type: 'results',
          data: results,
        },
      );
    });

    it('should serialize complex nested result data correctly', async () => {
      const electionId = 'e-complex';
      const results = {
        candidates: [
          { id: 'c1', voteCount: 1000, percentage: 55.5, metadata: { region: 'north' } },
        ],
        lastUpdated: '2026-03-10T14:00:00Z',
      };

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
    it('should call RedisPubSub.publish with correct channel and serialized turnout data', async () => {
      const electionId = 'election-uuid-2';
      const turnoutData = {
        district: 'Central',
        percentage: 42.5,
        actualVoters: 850,
        eligibleVoters: 2000,
      };

      await service.publishTurnout(electionId, turnoutData);

      expect(redisPubSub.publish).toHaveBeenCalledTimes(1);
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
    it('should call RedisPubSub.publish with correct channel and serialized list data', async () => {
      const electionId = 'election-uuid-3';
      const listData = { slotNumber: 5, candidateId: 'c3', action: 'assigned' };

      await service.publishListUpdate(electionId, listData);

      expect(redisPubSub.publish).toHaveBeenCalledTimes(1);
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
  // Redis message routing via onModuleInit subscription
  // ---------------------------------------------------------------------------
  describe('Redis message routing', () => {
    let callback: (message: string) => void;

    beforeEach(async () => {
      await service.onModuleInit();
      callback = redisPubSub.subscribe.mock.calls[0][1];
    });

    it('should route results message to gateway.broadcastResults', () => {
      const message = JSON.stringify({
        electionId: 'e1',
        type: 'results',
        data: [{ candidateId: 'c1', voteCount: 100 }],
      });

      callback(message);

      expect(gateway.broadcastResults).toHaveBeenCalledWith('e1', [
        { candidateId: 'c1', voteCount: 100 },
      ]);
      expect(gateway.broadcastTurnout).not.toHaveBeenCalled();
      expect(gateway.broadcastListUpdate).not.toHaveBeenCalled();
    });

    it('should route turnout message to gateway.broadcastTurnout', () => {
      const message = JSON.stringify({
        electionId: 'e1',
        type: 'turnout',
        data: { percentage: 55.2 },
      });

      callback(message);

      expect(gateway.broadcastTurnout).toHaveBeenCalledWith('e1', {
        percentage: 55.2,
      });
      expect(gateway.broadcastResults).not.toHaveBeenCalled();
      expect(gateway.broadcastListUpdate).not.toHaveBeenCalled();
    });

    it('should route listUpdate message to gateway.broadcastListUpdate', () => {
      const message = JSON.stringify({
        electionId: 'e1',
        type: 'listUpdate',
        data: { position: 3, candidateName: 'Test' },
      });

      callback(message);

      expect(gateway.broadcastListUpdate).toHaveBeenCalledWith('e1', {
        position: 3,
        candidateName: 'Test',
      });
      expect(gateway.broadcastResults).not.toHaveBeenCalled();
      expect(gateway.broadcastTurnout).not.toHaveBeenCalled();
    });

    it('should handle malformed JSON gracefully (logged as error, not thrown)', () => {
      expect(() => callback('this is not valid JSON')).not.toThrow();
      expect(gateway.broadcastResults).not.toHaveBeenCalled();
      expect(gateway.broadcastTurnout).not.toHaveBeenCalled();
      expect(gateway.broadcastListUpdate).not.toHaveBeenCalled();
    });

    it('should ignore unknown message type gracefully', () => {
      const message = JSON.stringify({
        electionId: 'e1',
        type: 'unknownType',
        data: { foo: 'bar' },
      });

      expect(() => callback(message)).not.toThrow();
      expect(gateway.broadcastResults).not.toHaveBeenCalled();
      expect(gateway.broadcastTurnout).not.toHaveBeenCalled();
      expect(gateway.broadcastListUpdate).not.toHaveBeenCalled();
    });

    it('should skip messages without electionId', () => {
      const message = JSON.stringify({
        type: 'results',
        data: { candidateId: 'c1' },
      });

      callback(message);

      expect(gateway.broadcastResults).not.toHaveBeenCalled();
    });

    it('should route messages for multiple elections to correct rooms', () => {
      callback(
        JSON.stringify({
          electionId: 'election-A',
          type: 'results',
          data: { candidates: ['a1'] },
        }),
      );
      callback(
        JSON.stringify({
          electionId: 'election-B',
          type: 'turnout',
          data: { percentage: 40 },
        }),
      );
      callback(
        JSON.stringify({
          electionId: 'election-C',
          type: 'listUpdate',
          data: { slot: 1 },
        }),
      );

      expect(gateway.broadcastResults).toHaveBeenCalledWith('election-A', { candidates: ['a1'] });
      expect(gateway.broadcastTurnout).toHaveBeenCalledWith('election-B', { percentage: 40 });
      expect(gateway.broadcastListUpdate).toHaveBeenCalledWith('election-C', { slot: 1 });
    });
  });

  // ---------------------------------------------------------------------------
  // getConnectionCount
  // ---------------------------------------------------------------------------
  describe('getConnectionCount', () => {
    it('should return correct count from gateway with electionId', () => {
      gateway.getConnectionCount.mockReturnValue(5);

      const count = service.getConnectionCount('election-uuid-1');

      expect(gateway.getConnectionCount).toHaveBeenCalledWith('election-uuid-1');
      expect(count).toBe(5);
    });

    it('should return correct count from gateway without electionId (global)', () => {
      gateway.getConnectionCount.mockReturnValue(42);

      const count = service.getConnectionCount();

      expect(gateway.getConnectionCount).toHaveBeenCalledWith(undefined);
      expect(count).toBe(42);
    });

    it('should return 0 when no clients are connected', () => {
      gateway.getConnectionCount.mockReturnValue(0);

      const count = service.getConnectionCount('empty-election');

      expect(count).toBe(0);
    });
  });
});
