import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShareLink } from './entities/share-link.entity';
import { CreateShareLinkDto } from './dto/create-share-link.dto';

@Injectable()
export class SharingService {
  private readonly logger = new Logger(SharingService.name);

  constructor(
    @InjectRepository(ShareLink)
    private readonly shareLinkRepository: Repository<ShareLink>,
  ) {}

  /**
   * Generate a random 8-character alphanumeric short code.
   */
  private generateShortCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate a unique short code, retrying on collision.
   */
  private async generateUniqueShortCode(): Promise<string> {
    const maxAttempts = 5;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const code = this.generateShortCode();
      const existing = await this.shareLinkRepository.findOne({
        where: { shortCode: code },
      });
      if (!existing) {
        return code;
      }
      this.logger.warn(`Short code collision on attempt ${attempt + 1}: ${code}`);
    }
    // Extremely unlikely to reach here with 62^8 possible codes
    throw new Error('Failed to generate unique short code after maximum attempts');
  }

  /**
   * Create a new share link with generated short code.
   */
  async createLink(dto: CreateShareLinkDto): Promise<ShareLink> {
    const shortCode = await this.generateUniqueShortCode();

    const shareLink = this.shareLinkRepository.create({
      contentType: dto.contentType,
      contentId: dto.contentId,
      shortCode,
      ogTitle: dto.ogTitle,
      ogDescription: dto.ogDescription,
      ogImageUrl: dto.ogImageUrl,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
    });

    const saved = await this.shareLinkRepository.save(shareLink);
    this.logger.log(
      `Created share link: ${saved.shortCode} -> ${saved.contentType}/${saved.contentId}`,
    );
    return saved;
  }

  /**
   * Resolve a short code: find the share link, increment click count, return content info.
   */
  async resolveShortCode(shortCode: string): Promise<ShareLink> {
    const shareLink = await this.shareLinkRepository.findOne({
      where: { shortCode },
    });

    if (!shareLink) {
      throw new NotFoundException(
        `Share link with short code "${shortCode}" not found`,
      );
    }

    // Increment click count asynchronously (fire-and-forget for performance)
    this.shareLinkRepository
      .increment({ id: shareLink.id }, 'clickCount', 1)
      .catch((err) =>
        this.logger.error(`Failed to increment click count: ${err.message}`),
      );

    return shareLink;
  }

  /**
   * Get a share link by short code without incrementing click count.
   * Used for OG meta tag rendering.
   */
  async getByShortCode(shortCode: string): Promise<ShareLink> {
    const shareLink = await this.shareLinkRepository.findOne({
      where: { shortCode },
    });

    if (!shareLink) {
      throw new NotFoundException(
        `Share link with short code "${shortCode}" not found`,
      );
    }

    return shareLink;
  }
}
