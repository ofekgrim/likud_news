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

@WebSocketGateway({ namespace: '/ws/ama', cors: { origin: '*' } })
export class AmaGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(AmaGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit(): void {
    this.logger.log('AMA WebSocket gateway initialized (namespace: /ws/ama)');
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

  @SubscribeMessage('joinAma')
  handleJoinAma(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ): { event: string; data: { room: string } } {
    const room = `ama:${data.sessionId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    return { event: 'joinedAma', data: { room } };
  }

  @SubscribeMessage('leaveAma')
  handleLeaveAma(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ): { event: string; data: { room: string } } {
    const room = `ama:${data.sessionId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left room ${room}`);
    return { event: 'leftAma', data: { room } };
  }

  /**
   * Broadcast when a new approved question is submitted.
   */
  broadcastNewQuestion(sessionId: string, question: unknown): void {
    const room = `ama:${sessionId}`;
    this.server.to(room).emit('newQuestion', question);
    this.logger.debug(`Broadcast newQuestion to room ${room}`);
  }

  /**
   * Broadcast when a candidate answers a question.
   */
  broadcastQuestionAnswered(sessionId: string, question: unknown): void {
    const room = `ama:${sessionId}`;
    this.server.to(room).emit('questionAnswered', question);
    this.logger.debug(`Broadcast questionAnswered to room ${room}`);
  }

  /**
   * Broadcast upvote count update.
   */
  broadcastQuestionUpvoted(
    sessionId: string,
    questionId: string,
    upvoteCount: number,
  ): void {
    const room = `ama:${sessionId}`;
    this.server
      .to(room)
      .emit('questionUpvoted', { questionId, upvoteCount });
    this.logger.debug(`Broadcast questionUpvoted to room ${room}`);
  }

  /**
   * Broadcast when session status changes (start/end).
   */
  broadcastSessionStatusChanged(
    sessionId: string,
    status: string,
  ): void {
    const room = `ama:${sessionId}`;
    this.server
      .to(room)
      .emit('sessionStatusChanged', { sessionId, status });
    this.logger.debug(`Broadcast sessionStatusChanged to room ${room}`);
  }

  /**
   * Get the number of connected clients.
   */
  getConnectionCount(sessionId?: string): number {
    if (sessionId) {
      const room = `ama:${sessionId}`;
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
