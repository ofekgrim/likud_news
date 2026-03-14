import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Cron } from '@nestjs/schedule';
import OpenAI from 'openai';
import { ArticleAiSummary } from './entities/article-ai-summary.entity';
import { Article } from '../articles/entities/article.entity';

const SUMMARIZE_PROMPT =
  'Summarize this Hebrew news article in 3 sentences. ' +
  'Also extract 3 key points as bullet points. ' +
  'Respond in JSON format: {"summary": "...", "keyPoints": ["...", "...", "..."], "politicalAngle": "..." or null}';

@Injectable()
export class SummarizationService {
  private readonly logger = new Logger(SummarizationService.name);
  private dictalmClient: OpenAI | null = null;
  private claudeClient: OpenAI | null = null;

  constructor(
    @InjectRepository(ArticleAiSummary)
    private readonly summaryRepository: Repository<ArticleAiSummary>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    const dictalmUrl = this.configService.get<string>('DICTALM_API_URL');
    if (dictalmUrl) {
      this.dictalmClient = new OpenAI({
        baseURL: dictalmUrl,
        apiKey: 'not-needed',
      });
    }

    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.claudeClient = new OpenAI({
        baseURL: 'https://api.anthropic.com/v1/',
        apiKey: anthropicKey,
      });
    }

    if (!this.dictalmClient && !this.claudeClient) {
      this.logger.warn(
        'No AI client configured (DICTALM_API_URL / ANTHROPIC_API_KEY) — summarization disabled',
      );
    }
  }

  /**
   * Get an existing summary, or null.
   */
  async getSummary(articleId: string): Promise<ArticleAiSummary | null> {
    // Check cache first
    const cacheKey = `ai:summary:${articleId}`;
    const cached = await this.cacheManager.get<ArticleAiSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    const summary = await this.summaryRepository.findOne({
      where: { articleId },
    });

    if (summary) {
      // Cache for 24 hours (in milliseconds)
      await this.cacheManager.set(cacheKey, summary, 24 * 60 * 60 * 1000);
    }

    return summary;
  }

  /**
   * Summarize an article. Returns existing summary if available.
   */
  async summarizeArticle(
    articleId: string,
  ): Promise<ArticleAiSummary | null> {
    // Check for existing summary
    const existing = await this.getSummary(articleId);
    if (existing) {
      return existing;
    }

    // If no AI client is configured, return null silently (logged once at startup)
    if (!this.dictalmClient && !this.claudeClient) {
      return null;
    }

    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      this.logger.warn(`Article ${articleId} not found for summarization`);
      return null;
    }

    const articleText = `${article.title}\n${article.subtitle || ''}\n${article.content}`;

    // Determine which model to use
    const useBreakingModel = article.isBreaking;
    let result: {
      summary: string;
      keyPoints: string[];
      politicalAngle: string | null;
    };
    let modelUsed: string;
    let tokensUsed: number;

    try {
      if (useBreakingModel && this.claudeClient) {
        const response = await this.callClaude(articleText);
        result = response.parsed;
        modelUsed = 'claude-sonnet';
        tokensUsed = response.tokensUsed;
      } else if (this.dictalmClient) {
        const response = await this.callDictaLM(articleText);
        result = response.parsed;
        modelUsed = 'dictalm-3.0';
        tokensUsed = response.tokensUsed;
      } else {
        const response = await this.callClaude(articleText);
        result = response.parsed;
        modelUsed = 'claude-sonnet';
        tokensUsed = response.tokensUsed;
      }
    } catch (error) {
      this.logger.error(
        `Failed to summarize article ${articleId}: ${error.message}`,
      );
      return null;
    }

    const summaryEntity = this.summaryRepository.create({
      articleId,
      summaryHe: result.summary,
      keyPointsHe: result.keyPoints,
      politicalAngleHe: result.politicalAngle ?? undefined,
      modelUsed,
      tokensUsed,
    } as Partial<ArticleAiSummary>);

    const saved = await this.summaryRepository.save(summaryEntity) as ArticleAiSummary;

    // Cache for 24 hours
    const cacheKey = `ai:summary:${articleId}`;
    await this.cacheManager.set(cacheKey, saved, 24 * 60 * 60 * 1000);

    return saved;
  }

  /**
   * Cron: process unsummarized published articles every 15 minutes.
   */
  @Cron('*/15 * * * *')
  async processUnsummarizedArticles(): Promise<void> {
    if (!this.dictalmClient && !this.claudeClient) {
      return; // No AI client — skip (logged once at startup)
    }

    const articles = await this.articleRepository
      .createQueryBuilder('a')
      .leftJoin(ArticleAiSummary, 'ais', 'ais.articleId = a.id')
      .where('ais.id IS NULL')
      .andWhere("a.status = 'published'")
      .orderBy('a.publishedAt', 'DESC')
      .take(10)
      .getMany();

    this.logger.log(
      `Cron: found ${articles.length} unsummarized articles to process`,
    );

    for (const article of articles) {
      try {
        await this.summarizeArticle(article.id);
      } catch (error) {
        this.logger.error(
          `Cron: failed to summarize article ${article.id}: ${error.message}`,
        );
      }
    }
  }

  private async callDictaLM(
    text: string,
  ): Promise<{
    parsed: { summary: string; keyPoints: string[]; politicalAngle: string | null };
    tokensUsed: number;
  }> {
    if (!this.dictalmClient) {
      throw new Error('DictaLM client not configured');
    }

    const response = await this.dictalmClient.chat.completions.create({
      model: 'dictalm-3.0',
      messages: [
        { role: 'system', content: SUMMARIZE_PROMPT },
        { role: 'user', content: text },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const tokensUsed = response.usage?.total_tokens || 0;

    return {
      parsed: JSON.parse(content),
      tokensUsed,
    };
  }

  private async callClaude(
    text: string,
  ): Promise<{
    parsed: { summary: string; keyPoints: string[]; politicalAngle: string | null };
    tokensUsed: number;
  }> {
    if (!this.claudeClient) {
      throw new Error('Claude client not configured');
    }

    const response = await this.claudeClient.chat.completions.create({
      model: 'claude-sonnet-4-20250514',
      messages: [
        { role: 'system', content: SUMMARIZE_PROMPT },
        { role: 'user', content: text },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const tokensUsed = response.usage?.total_tokens || 0;

    return {
      parsed: JSON.parse(content),
      tokensUsed,
    };
  }
}
