import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleEmbedding } from './entities/article-embedding.entity';
import { EmbeddingService } from './embedding.service';

export interface RetrievedChunk {
  chunkText: string;
  articleId: string;
  score: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    @InjectRepository(ArticleEmbedding)
    private readonly embeddingRepository: Repository<ArticleEmbedding>,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Retrieve the top-K most relevant article chunks for a query.
   * Uses pgvector cosine distance for similarity search.
   */
  async retrieveContext(
    query: string,
    topK = 5,
  ): Promise<RetrievedChunk[]> {
    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      const embeddingStr = `[${queryEmbedding.join(',')}]`;

      const results = await this.embeddingRepository.query(
        `SELECT "chunkText", "articleId", 1 - (embedding <=> $1::vector) AS score
         FROM article_embeddings
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        [embeddingStr, topK],
      );

      return results.map((row: any) => ({
        chunkText: row.chunkText,
        articleId: row.articleId,
        score: parseFloat(row.score),
      }));
    } catch (error) {
      this.logger.error(`RAG retrieval failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Build a context prompt from retrieved chunks for injection into LLM prompt.
   */
  buildContextPrompt(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) {
      return '';
    }

    const contextParts = chunks.map(
      (chunk, i) =>
        `[מקור ${i + 1}] (מאמר: ${chunk.articleId}, ציון: ${chunk.score.toFixed(2)})\n${chunk.chunkText}`,
    );

    return `הנה מידע רלוונטי מכתבות אחרונות:\n\n${contextParts.join('\n\n---\n\n')}\n\nהשתמש במידע הזה כדי לענות על השאלה. ציין את המקורות כשרלוונטי.`;
  }
}
