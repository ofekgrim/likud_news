import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RagService, RetrievedChunk } from './rag.service';
import { EmbeddingService } from './embedding.service';
import { ArticleEmbedding } from './entities/article-embedding.entity';

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
  query: jest.fn(),
});

const mockEmbeddingService = {
  generateEmbedding: jest.fn(),
};

describe('RagService', () => {
  let service: RagService;
  let embeddingRepository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        {
          provide: getRepositoryToken(ArticleEmbedding),
          useFactory: mockRepository,
        },
        { provide: EmbeddingService, useValue: mockEmbeddingService },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
    embeddingRepository = module.get(getRepositoryToken(ArticleEmbedding));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── retrieveContext ─────────────────────────────────────────────────
  describe('retrieveContext', () => {
    it('should return top-K chunks with scores', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(queryEmbedding);

      const dbResults = [
        { chunkText: 'Likud was founded...', articleId: 'art-1', score: '0.95' },
        { chunkText: 'Begin was elected...', articleId: 'art-2', score: '0.87' },
        { chunkText: 'Party platform...', articleId: 'art-3', score: '0.82' },
      ];
      embeddingRepository.query.mockResolvedValue(dbResults);

      const result = await service.retrieveContext('What is Likud?', 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        chunkText: 'Likud was founded...',
        articleId: 'art-1',
        score: 0.95,
      });
      expect(result[1].score).toBe(0.87);
      expect(result[2].articleId).toBe('art-3');

      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith(
        'What is Likud?',
      );
      expect(embeddingRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM article_embeddings'),
        expect.arrayContaining([expect.stringContaining('['), 3]),
      );
    });

    it('should return empty array when no results', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(queryEmbedding);
      embeddingRepository.query.mockResolvedValue([]);

      const result = await service.retrieveContext('obscure query');

      expect(result).toEqual([]);
    });

    it('should return empty array on embedding failure', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValue(
        new Error('Embedding API down'),
      );

      const result = await service.retrieveContext('query');

      expect(result).toEqual([]);
    });

    it('should use default topK of 5', async () => {
      const queryEmbedding = new Array(768).fill(0.1);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(queryEmbedding);
      embeddingRepository.query.mockResolvedValue([]);

      await service.retrieveContext('query');

      expect(embeddingRepository.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([expect.any(String), 5]),
      );
    });
  });

  // ── buildContextPrompt ──────────────────────────────────────────────
  describe('buildContextPrompt', () => {
    it('should format chunks into Hebrew context prompt', () => {
      const chunks: RetrievedChunk[] = [
        { chunkText: 'Chunk one text', articleId: 'art-1', score: 0.95 },
        { chunkText: 'Chunk two text', articleId: 'art-2', score: 0.85 },
      ];

      const result = service.buildContextPrompt(chunks);

      expect(result).toContain('מקור 1');
      expect(result).toContain('מקור 2');
      expect(result).toContain('Chunk one text');
      expect(result).toContain('Chunk two text');
      expect(result).toContain('art-1');
      expect(result).toContain('0.95');
      expect(result).toContain('השתמש במידע הזה');
    });

    it('should return empty string for empty chunks', () => {
      const result = service.buildContextPrompt([]);
      expect(result).toBe('');
    });
  });
});
