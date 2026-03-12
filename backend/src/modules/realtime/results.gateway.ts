import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JoinElectionDto } from './dto/join-election.dto';

@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
export class ResultsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ResultsGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit(): void {
    this.logger.log('WebSocket gateway initialized (namespace: /ws)');
  }

  handleConnection(client: Socket): void {
    this.logger.log(
      `Client connected: ${client.id} (total: ${this.getGlobalConnectionCount()})`,
    );
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(
      `Client disconnected: ${client.id} (total: ${this.getGlobalConnectionCount() - 1})`,
    );
  }

  @SubscribeMessage('joinElection')
  handleJoinElection(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinElectionDto,
  ): { event: string; data: { room: string } } {
    const room = `election:${data.electionId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { event: 'joinedElection', data: { room } };
  }

  @SubscribeMessage('leaveElection')
  handleLeaveElection(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinElectionDto,
  ): { event: string; data: { room: string } } {
    const room = `election:${data.electionId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { event: 'leftElection', data: { room } };
  }

  /**
   * Broadcast election results to all clients in the election room.
   */
  broadcastResults(electionId: string, results: unknown): void {
    const room = `election:${electionId}`;
    this.server.to(room).emit('electionResults', results);
    this.logger.debug(`Broadcast results to room ${room}`);
  }

  /**
   * Broadcast turnout data to all clients in the election room.
   */
  broadcastTurnout(electionId: string, turnoutData: unknown): void {
    const room = `election:${electionId}`;
    this.server.to(room).emit('turnoutUpdate', turnoutData);
    this.logger.debug(`Broadcast turnout to room ${room}`);
  }

  /**
   * Broadcast list assembly update to all clients in the election room.
   */
  broadcastListUpdate(electionId: string, listData: unknown): void {
    const room = `election:${electionId}`;
    this.server.to(room).emit('listUpdate', listData);
    this.logger.debug(`Broadcast list update to room ${room}`);
  }

  /**
   * Get the number of connected clients, optionally filtered by election room.
   */
  getConnectionCount(electionId?: string): number {
    if (electionId) {
      const room = `election:${electionId}`;
      const adapter = this.server?.adapter as any;
      const roomObj = adapter?.rooms?.get(room);
      return roomObj ? roomObj.size : 0;
    }
    return this.getGlobalConnectionCount();
  }

  private getGlobalConnectionCount(): number {
    return this.server?.sockets?.sockets?.size ?? 0;
  }
}
