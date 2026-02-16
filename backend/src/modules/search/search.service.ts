import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../articles/entities/article.entity';
import { Member } from '../members/entities/member.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  async search(
    q: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    articles: { data: Article[]; total: number };
    members: { data: Member[]; total: number };
  }> {
    const searchTerm = `%${q}%`;

    const [articles, articlesTotal] = await this.articleRepository
      .createQueryBuilder('article')
      .where('article.title ILIKE :searchTerm', { searchTerm })
      .orWhere('article.content ILIKE :searchTerm', { searchTerm })
      .orderBy('article.publishedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const [members, membersTotal] = await this.memberRepository
      .createQueryBuilder('member')
      .where('member.name ILIKE :searchTerm', { searchTerm })
      .orWhere('member.bio ILIKE :searchTerm', { searchTerm })
      .orderBy('member.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      articles: { data: articles, total: articlesTotal },
      members: { data: members, total: membersTotal },
    };
  }
}
