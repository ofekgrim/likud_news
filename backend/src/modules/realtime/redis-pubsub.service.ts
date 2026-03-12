import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private publisher: Redis;
  private subscriber: Redis;
  private readonly subscriptions = new Map<string, ((data: string) => void)[]>();

  constructor(private readonly configService: ConfigService) {
    const redisConfig = {
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
      password: this.configService.get<string>('redis.password') || undefined,
      lazyConnect: true,
    };

    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);

    this.publisher.on('error', (err) => {
      this.logger.warn(`Redis publisher error: ${err.message}`);
    });

    this.subscriber.on('error', (err) => {
      this.logger.warn(`Redis subscriber error: ${err.message}`);
    });

    this.subscriber.on('message', (channel: string, message: string) => {
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        for (const callback of callbacks) {
          try {
            callback(message);
          } catch (err) {
            this.logger.error(
              `Error in subscription callback for channel ${channel}: ${err}`,
            );
          }
        }
      }
    });

    // Attempt to connect (non-blocking — errors are caught by event handlers)
    this.publisher.connect().catch(() => {
      this.logger.warn('Redis publisher connection failed — pub/sub disabled');
    });
    this.subscriber.connect().catch(() => {
      this.logger.warn(
        'Redis subscriber connection failed — pub/sub disabled',
      );
    });
  }

  /**
   * Publish a JSON-serialized message to a Redis channel.
   */
  async publish(channel: string, data: unknown): Promise<void> {
    try {
      const message = JSON.stringify(data);
      await this.publisher.publish(channel, message);
      this.logger.debug(`Published to ${channel}`);
    } catch (err) {
      this.logger.warn(`Failed to publish to ${channel}: ${err}`);
    }
  }

  /**
   * Subscribe to a Redis channel and invoke the callback on each message.
   */
  async subscribe(
    channel: string,
    callback: (data: string) => void,
  ): Promise<void> {
    const existing = this.subscriptions.get(channel);
    if (existing) {
      existing.push(callback);
    } else {
      this.subscriptions.set(channel, [callback]);
      try {
        await this.subscriber.subscribe(channel);
        this.logger.log(`Subscribed to Redis channel: ${channel}`);
      } catch (err) {
        this.logger.warn(
          `Failed to subscribe to ${channel}: ${err}`,
        );
      }
    }
  }

  /**
   * Unsubscribe from a Redis channel.
   */
  async unsubscribe(channel: string): Promise<void> {
    this.subscriptions.delete(channel);
    try {
      await this.subscriber.unsubscribe(channel);
      this.logger.log(`Unsubscribed from Redis channel: ${channel}`);
    } catch (err) {
      this.logger.warn(`Failed to unsubscribe from ${channel}: ${err}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      this.subscriber.disconnect();
      this.publisher.disconnect();
    } catch {
      // Ignore disconnect errors during shutdown
    }
  }
}
