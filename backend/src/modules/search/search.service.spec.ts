import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { Article } from '../articles/entities/article.entity';
import { Member } from '../members/entities/member.entity';

const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
});

const mockArticleRepository = () => ({
  createQueryBuilder: jest.fn(),
});

const mockMemberRepository = () => ({
  createQueryBuilder: jest.fn(),
});

describe('SearchService', () => {
  let service: SearchService;
  let articleRepository: ReturnType<typeof mockArticleRepository>;
  let memberRepository: ReturnType<typeof mockMemberRepository>;
  let articleQb: ReturnType<typeof createMockQueryBuilder>;
  let memberQb: ReturnType<typeof createMockQueryBuilder>;

  const mockArticle = {
    id: 'article-uuid-1',
    title: 'חדשות הליכוד',
    content: 'תוכן מאמר',
    publishedAt: new Date(),
  };

  const mockMember = {
    id: 'member-uuid-1',
    name: 'בנימין נתניהו',
    bio: 'ראש ממשלת ישראל',
  };

  beforeEach(async () => {
    articleQb = createMockQueryBuilder();
    memberQb = createMockQueryBuilder();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: getRepositoryToken(Article),
          useFactory: mockArticleRepository,
        },
        {
          provide: getRepositoryToken(Member),
          useFactory: mockMemberRepository,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    articleRepository = module.get(getRepositoryToken(Article));
    memberRepository = module.get(getRepositoryToken(Member));

    articleRepository.createQueryBuilder.mockReturnValue(articleQb);
    memberRepository.createQueryBuilder.mockReturnValue(memberQb);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should search articles and members in parallel', async () => {
      articleQb.getManyAndCount.mockResolvedValue([[mockArticle], 1]);
      memberQb.getManyAndCount.mockResolvedValue([[mockMember], 1]);

      const result = await service.search('חדשות');

      expect(articleRepository.createQueryBuilder).toHaveBeenCalledWith('article');
      expect(articleQb.where).toHaveBeenCalledWith(
        'article.title ILIKE :searchTerm',
        { searchTerm: '%חדשות%' },
      );
      expect(articleQb.orWhere).toHaveBeenCalledWith(
        'article.content ILIKE :searchTerm',
        { searchTerm: '%חדשות%' },
      );
      expect(articleQb.orderBy).toHaveBeenCalledWith('article.publishedAt', 'DESC');

      expect(memberRepository.createQueryBuilder).toHaveBeenCalledWith('member');
      expect(memberQb.where).toHaveBeenCalledWith(
        'member.name ILIKE :searchTerm',
        { searchTerm: '%חדשות%' },
      );
      expect(memberQb.orWhere).toHaveBeenCalledWith(
        'member.bio ILIKE :searchTerm',
        { searchTerm: '%חדשות%' },
      );
      expect(memberQb.orderBy).toHaveBeenCalledWith('member.name', 'ASC');

      expect(result).toEqual({
        articles: { data: [mockArticle], total: 1 },
        members: { data: [mockMember], total: 1 },
      });
    });

    it('should return paginated results', async () => {
      articleQb.getManyAndCount.mockResolvedValue([[mockArticle], 50]);
      memberQb.getManyAndCount.mockResolvedValue([[mockMember], 10]);

      const result = await service.search('ליכוד', 3, 10);

      expect(articleQb.skip).toHaveBeenCalledWith(20); // (3 - 1) * 10
      expect(articleQb.take).toHaveBeenCalledWith(10);
      expect(memberQb.skip).toHaveBeenCalledWith(20);
      expect(memberQb.take).toHaveBeenCalledWith(10);

      expect(result.articles.total).toBe(50);
      expect(result.members.total).toBe(10);
    });

    it('should handle empty results', async () => {
      articleQb.getManyAndCount.mockResolvedValue([[], 0]);
      memberQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.search('nonexistent');

      expect(result).toEqual({
        articles: { data: [], total: 0 },
        members: { data: [], total: 0 },
      });
    });
  });
});
