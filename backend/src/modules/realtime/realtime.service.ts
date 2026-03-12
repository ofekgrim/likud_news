import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ResultsGateway } from './results.gateway';
import { RedisPubSubService } from './redis-pubsub.service';

@Injectable()
export class RealtimeService implements OnModuleInit {
  private readonly logger = new Logger(RealtimeService.name);

  constructor(
    private readonly gateway: ResultsGateway,
    private readonly redisPubSub: RedisPubSubService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Subscribe to Redis channels for cross-instance broadcasting
    await this.redisPubSub.subscribe(
      'election_results:*',
      (message: string) => {
        try {
          const parsed = JSON.parse(message);
          const { electionId, type, data } = parsed;
          if (!electionId) return;

          switch (type) {
            case 'results':
              this.gateway.broadcastResults(electionId, data);
              break;
            case 'turnout':
              this.gateway.broadcastTurnout(electionId, data);
              break;
            case 'listUpdate':
              this.gateway.broadcastListUpdate(electionId, data);
              break;
            default:
              this.logger.warn(`Unknown message type: ${type}`);
          }
        } catch (err) {
          this.logger.error(`Failed to process Redis message: ${err}`);
        }
      },
    );
  }

  /**
   * Publish election results update via Redis pub/sub.
   * All instances will receive this and broadcast to their local WebSocket clients.
   */
  async publishResults(electionId: string, results: unknown): Promise<void> {
    await this.redisPubSub.publish(`election_results:${electionId}`, {
      electionId,
      type: 'results',
      data: results,
    });
    this.logger.log(`Published results for election ${electionId}`);
  }

  /**
   * Publish turnout update via Redis pub/sub.
   */
  async publishTurnout(electionId: string, data: unknown): Promise<void> {
    await this.redisPubSub.publish(`election_results:${electionId}`, {
      electionId,
      type: 'turnout',
      data,
    });
    this.logger.log(`Published turnout for election ${electionId}`);
  }

  /**
   * Publish list assembly update via Redis pub/sub.
   */
  async publishListUpdate(electionId: string, data: unknown): Promise<void> {
    await this.redisPubSub.publish(`election_results:${electionId}`, {
      electionId,
      type: 'listUpdate',
      data,
    });
    this.logger.log(`Published list update for election ${electionId}`);
  }

  /**
   * Get the number of connected WebSocket clients.
   * Optionally filter by election room.
   */
  getConnectionCount(electionId?: string): number {
    return this.gateway.getConnectionCount(electionId);
  }
}
