import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PushToken } from '../push/entities/push-token.entity';
import { AudienceRulesDto } from './dto/audience-rules.dto';

@Injectable()
export class NotificationAudienceService {
  private readonly logger = new Logger(NotificationAudienceService.name);

  constructor(
    @InjectRepository(PushToken)
    private readonly pushTokenRepo: Repository<PushToken>,
  ) {}

  /**
   * Resolve audience rules to a list of active push tokens.
   */
  async resolveAudience(rules: AudienceRulesDto): Promise<PushToken[]> {
    const qb = this.buildAudienceQuery(rules);
    const tokens = await qb.getMany();
    this.logger.log(`Resolved audience: ${tokens.length} tokens for rules type="${rules.type}"`);
    return tokens;
  }

  /**
   * Count matching tokens without fetching them (for preview).
   */
  async countAudience(rules: AudienceRulesDto): Promise<number> {
    const qb = this.buildAudienceQuery(rules);
    return qb.getCount();
  }

  private buildAudienceQuery(rules: AudienceRulesDto): SelectQueryBuilder<PushToken> {
    const qb = this.pushTokenRepo
      .createQueryBuilder('token')
      .leftJoin('token.user', 'appUser')
      .where('token.isActive = :active', { active: true });

    if (rules.type === 'all') {
      // No additional filters — send to all active tokens
      return this.applyExclusions(qb, rules);
    }

    if (rules.type === 'specific_users' && rules.userIds?.length) {
      qb.andWhere('token.userId IN (:...userIds)', {
        userIds: rules.userIds,
      });
      return this.applyExclusions(qb, rules);
    }

    // Targeted audience
    if (rules.roles?.length) {
      qb.andWhere('appUser.role IN (:...roles)', { roles: rules.roles });
    }

    if (rules.membershipStatuses?.length) {
      qb.andWhere('appUser.membershipStatus IN (:...statuses)', {
        statuses: rules.membershipStatuses,
      });
    }

    if (rules.preferredCategories?.length) {
      // AppUser.preferredCategories is a uuid[] array column
      qb.andWhere('appUser.preferredCategories && :cats', {
        cats: rules.preferredCategories,
      });
    }

    if (rules.platforms?.length) {
      qb.andWhere('token.platform IN (:...platforms)', {
        platforms: rules.platforms,
      });
    }

    // Filter by notification preference key
    if (rules.notificationPrefKey) {
      qb.andWhere(`appUser.notificationPrefs ->> :prefKey = 'true'`, {
        prefKey: rules.notificationPrefKey,
      });
    }

    return this.applyExclusions(qb, rules);
  }

  private applyExclusions(
    qb: SelectQueryBuilder<PushToken>,
    rules: AudienceRulesDto,
  ): SelectQueryBuilder<PushToken> {
    if (rules.excludeUserIds?.length) {
      qb.andWhere('(token.userId IS NULL OR token.userId NOT IN (:...excludeIds))', {
        excludeIds: rules.excludeUserIds,
      });
    }
    return qb;
  }
}
