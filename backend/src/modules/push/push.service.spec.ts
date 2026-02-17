import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushService } from './push.service';
import { PushToken } from './entities/push-token.entity';
import { FIREBASE_ADMIN } from './firebase-admin.provider';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  findAndCount: jest.fn(),
  createQueryBuilder: jest.fn(),
  update: jest.fn(),
});

describe('PushService', () => {
  let service: PushService;
  let repository: jest.Mocked<Repository<PushToken>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: getRepositoryToken(PushToken), useFactory: mockRepository },
        { provide: FIREBASE_ADMIN, useValue: null },
      ],
    }).compile();

    service = module.get<PushService>(PushService);
    repository = module.get(getRepositoryToken(PushToken));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerToken', () => {
    const dto = {
      deviceId: 'device-abc-123',
      token: 'fcm-token-xyz',
      platform: 'ios',
    };

    it('should create new token when none exists', async () => {
      const newToken = {
        id: 'uuid-1',
        ...dto,
        isActive: true,
      } as PushToken;

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(newToken);
      repository.save.mockResolvedValue(newToken);

      const result = await service.registerToken(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { deviceId: dto.deviceId },
      });
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(newToken);
      expect(result).toEqual(newToken);
    });

    it('should update existing token', async () => {
      const existing = {
        id: 'uuid-1',
        deviceId: 'device-abc-123',
        token: 'old-token',
        platform: 'android',
        isActive: false,
      } as PushToken;

      const updated = {
        ...existing,
        token: dto.token,
        platform: dto.platform,
        isActive: true,
      } as PushToken;

      repository.findOne.mockResolvedValue(existing);
      repository.save.mockResolvedValue(updated);

      const result = await service.registerToken(dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { deviceId: dto.deviceId },
      });
      expect(existing.token).toBe(dto.token);
      expect(existing.platform).toBe(dto.platform);
      expect(existing.isActive).toBe(true);
      expect(repository.save).toHaveBeenCalledWith(existing);
      expect(repository.create).not.toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should handle correct deviceId lookup', async () => {
      const dto2 = {
        deviceId: 'unique-device-456',
        token: 'fcm-token-new',
        platform: 'android',
      };

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({ id: 'uuid-2', ...dto2 } as any);
      repository.save.mockResolvedValue({ id: 'uuid-2', ...dto2 } as any);

      await service.registerToken(dto2);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { deviceId: 'unique-device-456' },
      });
    });
  });

  describe('sendToAll', () => {
    it('should return {sent: 0, failed: 0} when firebaseApp is null', async () => {
      const dto = {
        title: 'Breaking News',
        body: 'Something happened',
      };

      const result = await service.sendToAll(dto);

      expect(result).toEqual({ sent: 0, failed: 0 });
      expect(repository.find).not.toHaveBeenCalled();
    });
  });

  describe('deactivateToken', () => {
    it('should set isActive to false', async () => {
      repository.update.mockResolvedValue({ affected: 1 } as any);

      await service.deactivateToken('device-abc-123');

      expect(repository.update).toHaveBeenCalledWith(
        { deviceId: 'device-abc-123' },
        { isActive: false },
      );
    });
  });
});
