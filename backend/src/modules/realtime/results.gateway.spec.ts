import { Test, TestingModule } from '@nestjs/testing';
import { ResultsGateway } from './results.gateway';
import { Socket, Server } from 'socket.io';

describe('ResultsGateway', () => {
  let gateway: ResultsGateway;

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    sockets: {
      sockets: new Map([
        ['socket-1', {}],
        ['socket-2', {}],
      ]),
    },
    adapter: {
      rooms: new Map<string, Set<string>>(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResultsGateway],
    }).compile();

    gateway = module.get<ResultsGateway>(ResultsGateway);
    gateway.server = mockServer as unknown as Server;

    // Reset mocks
    mockServer.to.mockClear().mockReturnThis();
    mockServer.emit.mockClear();
    mockServer.adapter.rooms.clear();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // afterInit
  // ---------------------------------------------------------------------------
  describe('afterInit', () => {
    it('should log initialization without throwing', () => {
      expect(() => gateway.afterInit()).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // handleConnection / handleDisconnect
  // ---------------------------------------------------------------------------
  describe('handleConnection', () => {
    it('should log when a client connects', () => {
      const client = { id: 'test-socket-1' } as Socket;
      expect(() => gateway.handleConnection(client)).not.toThrow();
    });
  });

  describe('handleDisconnect', () => {
    it('should log when a client disconnects', () => {
      const client = { id: 'test-socket-1' } as Socket;
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // joinElection
  // ---------------------------------------------------------------------------
  describe('handleJoinElection', () => {
    it('should join the client to the correct election room', () => {
      const client = {
        id: 'test-socket-1',
        join: jest.fn(),
      } as unknown as Socket;
      const data = { electionId: 'election-uuid-1' };

      const result = gateway.handleJoinElection(client, data);

      expect(client.join).toHaveBeenCalledWith('election:election-uuid-1');
      expect(result).toEqual({
        event: 'joinedElection',
        data: { room: 'election:election-uuid-1' },
      });
    });

    it('should handle different election IDs', () => {
      const client = {
        id: 'test-socket-2',
        join: jest.fn(),
      } as unknown as Socket;
      const data = { electionId: 'election-uuid-99' };

      const result = gateway.handleJoinElection(client, data);

      expect(client.join).toHaveBeenCalledWith('election:election-uuid-99');
      expect(result.data.room).toBe('election:election-uuid-99');
    });
  });

  // ---------------------------------------------------------------------------
  // leaveElection
  // ---------------------------------------------------------------------------
  describe('handleLeaveElection', () => {
    it('should remove the client from the election room', () => {
      const client = {
        id: 'test-socket-1',
        leave: jest.fn(),
      } as unknown as Socket;
      const data = { electionId: 'election-uuid-1' };

      const result = gateway.handleLeaveElection(client, data);

      expect(client.leave).toHaveBeenCalledWith('election:election-uuid-1');
      expect(result).toEqual({
        event: 'leftElection',
        data: { room: 'election:election-uuid-1' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // broadcastResults
  // ---------------------------------------------------------------------------
  describe('broadcastResults', () => {
    it('should emit electionResults to the correct room', () => {
      const electionId = 'election-uuid-1';
      const results = [
        { candidateId: 'c1', voteCount: 500 },
        { candidateId: 'c2', voteCount: 300 },
      ];

      gateway.broadcastResults(electionId, results);

      expect(mockServer.to).toHaveBeenCalledWith('election:election-uuid-1');
      expect(mockServer.emit).toHaveBeenCalledWith('electionResults', results);
    });

    it('should handle empty results', () => {
      gateway.broadcastResults('election-uuid-1', []);

      expect(mockServer.to).toHaveBeenCalledWith('election:election-uuid-1');
      expect(mockServer.emit).toHaveBeenCalledWith('electionResults', []);
    });
  });

  // ---------------------------------------------------------------------------
  // broadcastTurnout
  // ---------------------------------------------------------------------------
  describe('broadcastTurnout', () => {
    it('should emit turnoutUpdate to the correct room', () => {
      const electionId = 'election-uuid-1';
      const turnoutData = {
        district: 'North',
        percentage: 45.5,
        actualVoters: 910,
        eligibleVoters: 2000,
      };

      gateway.broadcastTurnout(electionId, turnoutData);

      expect(mockServer.to).toHaveBeenCalledWith('election:election-uuid-1');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'turnoutUpdate',
        turnoutData,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // broadcastListUpdate
  // ---------------------------------------------------------------------------
  describe('broadcastListUpdate', () => {
    it('should emit listUpdate to the correct room', () => {
      const electionId = 'election-uuid-1';
      const listData = { position: 1, candidateName: 'Test Candidate' };

      gateway.broadcastListUpdate(electionId, listData);

      expect(mockServer.to).toHaveBeenCalledWith('election:election-uuid-1');
      expect(mockServer.emit).toHaveBeenCalledWith('listUpdate', listData);
    });
  });

  // ---------------------------------------------------------------------------
  // getConnectionCount
  // ---------------------------------------------------------------------------
  describe('getConnectionCount', () => {
    it('should return global connection count when no electionId', () => {
      const count = gateway.getConnectionCount();
      expect(count).toBe(2); // mockServer has 2 sockets
    });

    it('should return room connection count when electionId is provided', () => {
      const roomSet = new Set(['socket-1', 'socket-3']);
      mockServer.adapter.rooms.set('election:election-uuid-1', roomSet);

      const count = gateway.getConnectionCount('election-uuid-1');
      expect(count).toBe(2);
    });

    it('should return 0 for an empty/nonexistent room', () => {
      const count = gateway.getConnectionCount('nonexistent-election');
      expect(count).toBe(0);
    });
  });
});
