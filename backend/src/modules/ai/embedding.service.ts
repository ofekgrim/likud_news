import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ArticleEmbedding } from './entities/article-embedding.entity';
import { Article } from '../articles/entities/article.entity';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private embeddingClient: OpenAI | null = null;
  private fallbackClient: OpenAI | null = null;

  constructor(
    @InjectRepository(ArticleEmbedding)
    private readonly embeddingRepository: Repository<ArticleEmbedding>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly configService: ConfigService,
  ) {
    const embeddingApiUrl = this.configService.get<string>('EMBEDDING_API_URL');
    if (embeddingApiUrl) {
      this.embeddingClient = new OpenAI({
        baseURL: embeddingApiUrl,
        apiKey: 'not-needed',
      });
    }

    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiApiKey) {
      this.fallbackClient = new OpenAI({
        apiKey: openaiApiKey,
      });
    }
  }

  /**
   * Generate a 768-dimensional embedding for the given text.
   * Primary: AlephBERT embedding API
   * Fallback: OpenAI text-embedding-3-small
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Try AlephBERT embedding API first
    if (this.embeddingClient) {
      try {
        const response = await this.embeddingClient.embeddings.create({
          model: 'alephbert-768',
          input: text,
        });
        return response.data[0].embedding;
      } catch (error) {
        this.logger.warn(
          `AlephBERT embedding failed, falling back to OpenAI: ${error.message}`,
        );
      }
    }

    // Fallback to OpenAI
    if (this.fallbackClient) {
      try {
        const response = await this.fallbackClient.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
          dimensions: 768,
        });
        return response.data[0].embedding;
      } catch (error) {
        this.logger.error(`OpenAI embedding failed: ${error.message}`);
        throw new Error('All embedding providers failed');
      }
    }

    throw new Error('No embedding provider configured');
  }

  /**
   * Split text into chunks with overlap.
   */
  splitIntoChunks(
    text: string,
    chunkSize = 500,
    overlap = 100,
  ): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }

    return chunks;
  }

  /**
   * Embed a single article: chunk its content, generate embeddings, save to DB.
   */
  async embedArticle(articleId: string): Promise<void> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });

    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }

    // Delete existing embeddings for this article
    await this.embeddingRepository.delete({ articleId });

    const fullText = `${article.title}\n${article.subtitle || ''}\n${article.content}`;
    const chunks = this.splitIntoChunks(fullText);

    for (let i = 0; i < chunks.length; i++) {
      const embeddingVector = await this.generateEmbedding(chunks[i]);

      const embedding = this.embeddingRepository.create({
        articleId,
        chunkIndex: i,
        chunkText: chunks[i],
        embedding: `[${embeddingVector.join(',')}]`,
        model: 'alephbert-768',
      });

      await this.embeddingRepository.save(embedding);
    }

    this.logger.log(
      `Embedded article ${articleId}: ${chunks.length} chunks`,
    );
  }

  /**
   * Batch embed all articles that don't have embeddings yet.
   */
  async embedAllArticles(): Promise<void> {
    const articles = await this.articleRepository
      .createQueryBuilder('a')
      .leftJoin(ArticleEmbedding, 'ae', 'ae.articleId = a.id')
      .where('ae.id IS NULL')
      .andWhere("a.status = 'published'")
      .getMany();

    this.logger.log(`Found ${articles.length} articles to embed`);

    for (const article of articles) {
      try {
        await this.embedArticle(article.id);
      } catch (error) {
        this.logger.error(
          `Failed to embed article ${article.id}: ${error.message}`,
        );
      }
    }
  }
}
