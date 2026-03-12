import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisPubSubService } from './redis-pubsub.service';

// These must be declared before jest.mock and prefixed with `mock` for Jest hoisting
const mockPublish = jest.fn().mockResolvedValue(1);
const mockSubscribe = jest.fn().mockResolvedValue(undefined);
const mockUnsubscribe = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn();
const mockOn = jest.fn();

jest.mock('ioredis', () => {
  const RedisMock = jest.fn().mockImplementation(() => ({
    publish: mockPublish,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    connect: mockConnect,
    disconnect: mockDisconnect,
    on: mockOn,
  }));
  // ioredis sets __esModule and exports the class as both module.exports and .default
  return Object.assign(RedisMock, {
    __esModule: true,
    default: RedisMock,
  });
});

describe('RedisPubSubService', () => {
  let service: RedisPubSubService;
  let messageHandler: ((channel: string, message: string) => void) | undefined;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Capture the 'message' event handler registered by the subscriber
    messageHandler = undefined;
    mockOn.mockImplementation(
      (event: string, handler: (...args: any[]) => void) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisPubSubService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                'redis.host': 'localhost',
                'redis.port': 6379,
                'redis.password': undefined,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisPubSubService>(RedisPubSubService);
  });

  afterEach(async () => {
    if (service) {
      await service.onModuleDestroy();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // publish
  // ---------------------------------------------------------------------------
  describe('publish', () => {
    it('should publish JSON-serialized data to the given channel', async () => {
      const channel = 'election_results:e1';
      const data = { electionId: 'e1', type: 'results', data: [] };

      await service.publish(channel, data);

      expect(mockPublish).toHaveBeenCalledWith(channel, JSON.stringify(data));
    });

    it('should handle publish errors gracefully', async () => {
      mockPublish.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(
        service.publish('channel', { test: true }),
      ).resolves.not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // subscribe
  // ---------------------------------------------------------------------------
  describe('subscribe', () => {
    it('should subscribe to a Redis channel and register callback', async () => {
      const callback = jest.fn();
      await service.subscribe('test-channel', callback);

      expect(mockSubscribe).toHaveBeenCalledWith('test-channel');
    });

    it('should add additional callbacks without re-subscribing', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      await service.subscribe('test-channel', callback1);
      await service.subscribe('test-channel', callback2);

      // subscribe should only be called once (for the first callback)
      expect(mockSubscribe).toHaveBeenCalledTimes(1);
    });

    it('should invoke callback when message is received on channel', async () => {
      const callback = jest.fn();
      await service.subscribe('test-channel', callback);

      // Simulate receiving a message via the captured handler
      if (messageHandler) {
        messageHandler('test-channel', '{"key":"value"}');
      }

      expect(callback).toHaveBeenCalledWith('{"key":"value"}');
    });

    it('should invoke all callbacks for a channel', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      await service.subscribe('test-channel', callback1);
      await service.subscribe('test-channel', callback2);

      if (messageHandler) {
        messageHandler('test-channel', 'msg');
      }

      expect(callback1).toHaveBeenCalledWith('msg');
      expect(callback2).toHaveBeenCalledWith('msg');
    });

    it('should not invoke callbacks for other channels', async () => {
      const callback = jest.fn();
      await service.subscribe('channel-a', callback);

      if (messageHandler) {
        messageHandler('channel-b', 'msg');
      }

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle subscribe errors gracefully', async () => {
      mockSubscribe.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(
        service.subscribe('channel', jest.fn()),
      ).resolves.not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // unsubscribe
  // ---------------------------------------------------------------------------
  describe('unsubscribe', () => {
    it('should unsubscribe from a Redis channel', async () => {
      const callback = jest.fn();
      await service.subscribe('test-channel', callback);
      await service.unsubscribe('test-channel');

      expect(mockUnsubscribe).toHaveBeenCalledWith('test-channel');
    });

    it('should remove callbacks so they are no longer invoked', async () => {
      const callback = jest.fn();
      await service.subscribe('test-channel', callback);
      await service.unsubscribe('test-channel');

      if (messageHandler) {
        messageHandler('test-channel', 'msg');
      }

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onModuleDestroy
  // ---------------------------------------------------------------------------
  describe('onModuleDestroy', () => {
    it('should disconnect both Redis clients', async () => {
      await service.onModuleDestroy();

      expect(mockDisconnect).toHaveBeenCalledTimes(2);
    });
  });
});
