import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { MediaService } from './media.service';
import { Media, MediaType } from './entities/media.entity';

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

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'aws.region': 'eu-west-1',
      'aws.accessKeyId': 'test-key',
      'aws.secretAccessKey': 'test-secret',
      'aws.s3Bucket': 'test-bucket',
      'aws.cloudfrontDomain': 'cdn.example.com',
    };
    return config[key];
  }),
};

describe('MediaService', () => {
  let service: MediaService;
  let repository: jest.Mocked<Repository<Media>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getRepositoryToken(Media), useFactory: mockRepository },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    repository = module.get(getRepositoryToken(Media));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('confirmUpload', () => {
    const confirmDto = {
      s3Key: 'media/2026/02/some-uuid.jpg',
      filename: 'photo.jpg',
      type: MediaType.IMAGE,
      mimeType: 'image/jpeg',
      size: 1024000,
    };

    it('should create media record', async () => {
      const media = {
        id: 'uuid-1',
        ...confirmDto,
        url: 'https://cdn.example.com/media/2026/02/some-uuid.jpg',
      } as unknown as Media;

      repository.create.mockReturnValue(media);
      repository.save.mockResolvedValue(media);

      const result = await service.confirmUpload(confirmDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...confirmDto,
        url: 'https://cdn.example.com/media/2026/02/some-uuid.jpg',
      });
      expect(repository.save).toHaveBeenCalledWith(media);
      expect(result).toEqual(media);
    });

    it('should use CloudFront domain when available', async () => {
      const media = {
        id: 'uuid-1',
        ...confirmDto,
        url: 'https://cdn.example.com/media/2026/02/some-uuid.jpg',
      } as unknown as Media;

      repository.create.mockReturnValue(media);
      repository.save.mockResolvedValue(media);

      await service.confirmUpload(confirmDto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://cdn.example.com/media/2026/02/some-uuid.jpg',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated media', async () => {
      const mediaItems = [
        { id: 'uuid-1', filename: 'photo1.jpg' },
        { id: 'uuid-2', filename: 'photo2.jpg' },
      ] as Media[];

      repository.findAndCount.mockResolvedValue([mediaItems, 2]);

      const result = await service.findAll(1, 20);

      expect(result).toEqual({
        data: mediaItems,
        total: 2,
        page: 1,
        limit: 20,
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('deleteMedia', () => {
    it('should delete media record', async () => {
      const media = {
        id: 'uuid-1',
        filename: 'photo.jpg',
        s3Key: 'media/2026/02/photo.jpg',
      } as Media;

      repository.findOne.mockResolvedValue(media);
      repository.remove.mockResolvedValue(media);

      // Mock the s3Client.send to prevent actual S3 calls
      (service as any).s3Client = { send: jest.fn().mockResolvedValue({}) };

      await service.deleteMedia('uuid-1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(repository.remove).toHaveBeenCalledWith(media);
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.deleteMedia('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
