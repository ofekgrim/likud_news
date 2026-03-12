import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { PushToken } from '../push/entities/push-token.entity';
import { PushService } from '../push/push.service';
import { AudienceRulesDto } from './dto/audience-rules.dto';

/**
 * Maps notification preference keys (used in audience rules) to the
 * corresponding boolean column on AppUser.
 */
const PREF_KEY_TO_COLUMN: Record<string, string> = {
  breakingNews: 'notifBreakingNews',
  primariesUpdates: 'notifPrimariesUpdates',
  dailyQuizReminder: 'notifDailyQuizReminder',
  streakAchievements: 'notifStreakAchievements',
  events: 'notifEvents',
  gotv: 'notifGotv',
  amaSessions: 'notifAmaSessions',
};

@Injectable()
export class NotificationAudienceService {
  private readonly logger = new Logger(NotificationAudienceService.name);

  constructor(
    @InjectRepository(PushToken)
    private readonly pushTokenRepo: Repository<PushToken>,
    private readonly pushService: PushService,
  ) {}

  /**
   * Resolve audience rules to a list of active push tokens.
   * Applies granular notification preferences, quiet hours filtering,
   * and frequency cap for non-breaking notifications.
   */
  async resolveAudience(rules: AudienceRulesDto): Promise<PushToken[]> {
    const qb = this.buildAudienceQuery(rules);
    const tokens = await qb.getMany();
    this.logger.log(`Resolved audience: ${tokens.length} tokens for rules type="${rules.type}"`);

    const isBreaking = rules.notificationPrefKey === 'breakingNews';

    if (isBreaking) {
      // Breaking news bypasses quiet hours and frequency cap
      return tokens;
    }

    // Filter out users in quiet hours and over frequency cap
    const filtered: PushToken[] = [];
    for (const token of tokens) {
      if (token.user) {
        // Check quiet hours
        if (this.pushService.isInQuietHours(token.user)) {
          continue;
        }

        // Check frequency cap
        if (token.userId) {
          const canSend = await this.pushService.checkFrequencyCap(token.userId);
          if (!canSend) {
            continue;
          }
        }
      }

      filtered.push(token);
    }

    // Increment frequency counters for users that passed
    for (const token of filtered) {
      if (token.userId) {
        await this.pushService.incrementFrequencyCount(token.userId);
      }
    }

    this.logger.log(
      `After quiet hours / frequency cap filter: ${filtered.length} of ${tokens.length} tokens`,
    );
    return filtered;
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
      .leftJoinAndSelect('token.user', 'appUser')
      .where('token.isActive = :active', { active: true });

    if (rules.type === 'all') {
      // Apply granular pref filter even for "all" audience
      this.applyNotificationPrefFilter(qb, rules);
      return this.applyExclusions(qb, rules);
    }

    if (rules.type === 'specific_users' && rules.userIds?.length) {
      qb.andWhere('token.userId IN (:...userIds)', {
        userIds: rules.userIds,
      });
      this.applyNotificationPrefFilter(qb, rules);
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

    // Filter by granular notification preference column
    this.applyNotificationPrefFilter(qb, rules);

    return this.applyExclusions(qb, rules);
  }

  /**
   * Apply granular notification preference column filter.
   * Maps notificationPrefKey to the typed boolean column on AppUser.
   * Falls back to the legacy JSONB lookup if the key is not recognized.
   */
  private applyNotificationPrefFilter(
    qb: SelectQueryBuilder<PushToken>,
    rules: AudienceRulesDto,
  ): void {
    if (!rules.notificationPrefKey) return;

    const column = PREF_KEY_TO_COLUMN[rules.notificationPrefKey];
    if (column) {
      qb.andWhere(`appUser."${column}" = true`);
    } else {
      // Legacy JSONB fallback for any old/custom preference keys
      qb.andWhere(`appUser."notificationPrefs" ->> :prefKey = 'true'`, {
        prefKey: rules.notificationPrefKey,
      });
    }
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
