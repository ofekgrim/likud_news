import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SharingService } from './sharing.service';
import { ShareLink, ShareContentType } from './entities/share-link.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  increment: jest.fn(),
});

describe('SharingService', () => {
  let service: SharingService;
  let repository: jest.Mocked<Repository<ShareLink>>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        { provide: getRepositoryToken(ShareLink), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
    repository = module.get(getRepositoryToken(ShareLink));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // createLink
  // ---------------------------------------------------------------------------
  describe('createLink', () => {
    it('should generate a unique shortCode and create a share link', async () => {
      // First findOne returns null => code is unique
      repository.findOne.mockResolvedValue(null);

      const shareLink = {
        id: 'link-1',
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
        shortCode: 'AbCd1234',
        clickCount: 0,
      } as ShareLink;

      repository.create.mockReturnValue(shareLink);
      repository.save.mockResolvedValue(shareLink);

      const dto = {
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
        ogTitle: 'Test Article',
        ogDescription: 'A test article',
      };

      const result = await service.createLink(dto as any);

      expect(result).toEqual(shareLink);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: ShareContentType.ARTICLE,
          contentId: 'article-uuid-1',
          ogTitle: 'Test Article',
          ogDescription: 'A test article',
        }),
      );
      expect(repository.save).toHaveBeenCalledWith(shareLink);
    });

    it('should retry on shortCode collision', async () => {
      // First attempt: collision (existing link found)
      // Second attempt: no collision (null)
      repository.findOne
        .mockResolvedValueOnce({ id: 'existing' } as ShareLink)
        .mockResolvedValueOnce(null);

      const shareLink = {
        id: 'link-1',
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
        shortCode: 'XyZw5678',
        clickCount: 0,
      } as ShareLink;

      repository.create.mockReturnValue(shareLink);
      repository.save.mockResolvedValue(shareLink);

      const dto = {
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
      };

      const result = await service.createLink(dto as any);

      expect(result).toEqual(shareLink);
      // findOne should have been called twice (collision retry)
      expect(repository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw Error after 5 failed collision retries', async () => {
      // All 5 attempts produce collisions
      repository.findOne.mockResolvedValue({ id: 'existing' } as ShareLink);

      const dto = {
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
      };

      await expect(service.createLink(dto as any)).rejects.toThrow(
        'Failed to generate unique short code after maximum attempts',
      );
      expect(repository.findOne).toHaveBeenCalledTimes(5);
    });

    it('should pass all DTO fields to repository.create', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({} as ShareLink);
      repository.save.mockResolvedValue({ shortCode: 'ABC12345' } as ShareLink);

      const dto = {
        contentType: ShareContentType.CANDIDATE,
        contentId: 'candidate-uuid-1',
        ogTitle: 'Candidate Page',
        ogDescription: 'Check this candidate',
        ogImageUrl: 'https://img.example.com/candidate.jpg',
        utmSource: 'whatsapp',
        utmMedium: 'social',
        utmCampaign: 'share-2026',
      };

      await service.createLink(dto as any);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: ShareContentType.CANDIDATE,
          contentId: 'candidate-uuid-1',
          ogTitle: 'Candidate Page',
          ogDescription: 'Check this candidate',
          ogImageUrl: 'https://img.example.com/candidate.jpg',
          utmSource: 'whatsapp',
          utmMedium: 'social',
          utmCampaign: 'share-2026',
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // resolveShortCode
  // ---------------------------------------------------------------------------
  describe('resolveShortCode', () => {
    it('should return the share link and increment click count', async () => {
      const shareLink = {
        id: 'link-1',
        shortCode: 'AbCd1234',
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
        clickCount: 5,
      } as ShareLink;

      repository.findOne.mockResolvedValue(shareLink);
      repository.increment.mockResolvedValue(undefined as any);

      const result = await service.resolveShortCode('AbCd1234');

      expect(result).toEqual(shareLink);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { shortCode: 'AbCd1234' },
      });
      expect(repository.increment).toHaveBeenCalledWith(
        { id: 'link-1' },
        'clickCount',
        1,
      );
    });

    it('should throw NotFoundException when shortCode does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.resolveShortCode('INVALID1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include the short code in the error message', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.resolveShortCode('BAD_CODE'),
      ).rejects.toThrow('Share link with short code "BAD_CODE" not found');
    });
  });

  // ---------------------------------------------------------------------------
  // getByShortCode
  // ---------------------------------------------------------------------------
  describe('getByShortCode', () => {
    it('should return the share link without incrementing click count', async () => {
      const shareLink = {
        id: 'link-1',
        shortCode: 'AbCd1234',
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
        clickCount: 10,
      } as ShareLink;

      repository.findOne.mockResolvedValue(shareLink);

      const result = await service.getByShortCode('AbCd1234');

      expect(result).toEqual(shareLink);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { shortCode: 'AbCd1234' },
      });
      // Should NOT increment click count
      expect(repository.increment).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when shortCode does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.getByShortCode('INVALID1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include the short code in the error message', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.getByShortCode('NOPE1234'),
      ).rejects.toThrow('Share link with short code "NOPE1234" not found');
    });
  });

  // ---------------------------------------------------------------------------
  // createLink — deduplication behavior
  // ---------------------------------------------------------------------------
  describe('createLink — content type handling', () => {
    it('should store correct contentType for article share links', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({} as ShareLink);
      repository.save.mockResolvedValue({ shortCode: 'ART12345' } as ShareLink);

      await service.createLink({
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
        ogTitle: 'Article Title',
      } as any);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: ShareContentType.ARTICLE,
          contentId: 'article-uuid-1',
        }),
      );
    });

    it('should store correct contentType for candidate share links', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({} as ShareLink);
      repository.save.mockResolvedValue({ shortCode: 'CND12345' } as ShareLink);

      await service.createLink({
        contentType: ShareContentType.CANDIDATE,
        contentId: 'candidate-uuid-1',
        ogTitle: 'Candidate Name',
        ogDescription: 'Candidate description',
      } as any);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: ShareContentType.CANDIDATE,
          contentId: 'candidate-uuid-1',
          ogTitle: 'Candidate Name',
          ogDescription: 'Candidate description',
        }),
      );
    });

    it('should generate a new unique shortCode for each createLink call', async () => {
      // No collisions
      repository.findOne.mockResolvedValue(null);

      const links: ShareLink[] = [];
      repository.create.mockImplementation((data) => data as ShareLink);
      repository.save.mockImplementation(async (entity) => {
        links.push(entity as ShareLink);
        return entity as ShareLink;
      });

      await service.createLink({
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
      } as any);

      await service.createLink({
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
      } as any);

      // Each call generates a new short code (no dedup in the service)
      expect(links).toHaveLength(2);
      expect(links[0].shortCode).toBeDefined();
      expect(links[1].shortCode).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // resolveShortCode — extended
  // ---------------------------------------------------------------------------
  describe('resolveShortCode — click tracking', () => {
    it('should increment click count on every resolve call', async () => {
      const shareLink = {
        id: 'link-1',
        shortCode: 'ClickMe1',
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
        clickCount: 42,
      } as ShareLink;

      repository.findOne.mockResolvedValue(shareLink);
      repository.increment.mockResolvedValue(undefined as any);

      await service.resolveShortCode('ClickMe1');

      expect(repository.increment).toHaveBeenCalledWith(
        { id: 'link-1' },
        'clickCount',
        1,
      );
    });

    it('should return the link data even when increment fails', async () => {
      const shareLink = {
        id: 'link-1',
        shortCode: 'FailIncr',
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
        clickCount: 5,
        ogTitle: 'Test',
      } as ShareLink;

      repository.findOne.mockResolvedValue(shareLink);
      // increment is fire-and-forget, so even if it fails the result is returned
      repository.increment.mockRejectedValue(new Error('DB error'));

      const result = await service.resolveShortCode('FailIncr');

      expect(result).toEqual(shareLink);
      expect(result.ogTitle).toBe('Test');
    });
  });

  // ---------------------------------------------------------------------------
  // getByShortCode — OG metadata for rendering
  // ---------------------------------------------------------------------------
  describe('getByShortCode — OG metadata retrieval', () => {
    it('should return all OG metadata fields for article links', async () => {
      const shareLink = {
        id: 'link-og-1',
        shortCode: 'OgArt123',
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-1',
        ogTitle: 'כותרת מאמר',
        ogDescription: 'תיאור המאמר',
        ogImageUrl: 'https://cdn.example.com/article.jpg',
        utmSource: 'whatsapp',
        utmMedium: 'social',
        utmCampaign: 'share-2026',
        clickCount: 10,
      } as ShareLink;

      repository.findOne.mockResolvedValue(shareLink);

      const result = await service.getByShortCode('OgArt123');

      expect(result.ogTitle).toBe('כותרת מאמר');
      expect(result.ogDescription).toBe('תיאור המאמר');
      expect(result.ogImageUrl).toBe('https://cdn.example.com/article.jpg');
      expect(result.contentType).toBe(ShareContentType.ARTICLE);
    });

    it('should return all OG metadata fields for candidate links', async () => {
      const shareLink = {
        id: 'link-og-2',
        shortCode: 'OgCand12',
        contentType: ShareContentType.CANDIDATE,
        contentId: 'candidate-uuid-1',
        ogTitle: 'שם מועמד',
        ogDescription: 'מועמד לפריימריז',
        ogImageUrl: 'https://cdn.example.com/candidate.jpg',
        clickCount: 5,
      } as ShareLink;

      repository.findOne.mockResolvedValue(shareLink);

      const result = await service.getByShortCode('OgCand12');

      expect(result.ogTitle).toBe('שם מועמד');
      expect(result.ogDescription).toBe('מועמד לפריימריז');
      expect(result.contentType).toBe(ShareContentType.CANDIDATE);
    });

    it('should handle links with minimal OG metadata', async () => {
      const shareLink = {
        id: 'link-og-3',
        shortCode: 'MinOg123',
        contentType: ShareContentType.ARTICLE,
        contentId: 'article-uuid-2',
        ogTitle: null,
        ogDescription: null,
        ogImageUrl: null,
        clickCount: 0,
      } as unknown as ShareLink;

      repository.findOne.mockResolvedValue(shareLink);

      const result = await service.getByShortCode('MinOg123');

      expect(result.ogTitle).toBeNull();
      expect(result.ogDescription).toBeNull();
      expect(result.ogImageUrl).toBeNull();
    });
  });
});
