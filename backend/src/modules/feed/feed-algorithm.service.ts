import { Injectable } from '@nestjs/common';
import { FeedItemDto, FeedItemType } from './dto/feed-item.dto';
import { UserFollowsMap } from '../user-follows/user-follows.service';

/**
 * Feed algorithm service that computes priority scores and interleaves content.
 *
 * Priority Algorithm (standard):
 * priority = typeWeight + pinnedBonus + breakingBonus + recencyBoost + engagementBoost
 *
 * Personalized Priority Algorithm:
 * score = base_recency_score
 *       + (followed_category ? +3 : 0)
 *       + (followed_member ? +5 : 0)
 *       + (followed_author ? +4 : 0)
 *       + (followed_tag ? +2 : 0)
 *       + recency_decay      // -1 per hour since publish (capped at -24)
 *       + popularity_boost   // min(viewCount / 100, 5)
 *
 * - typeWeight: Base priority by type (election=1000, article=500, poll=400, event=300)
 * - pinnedBonus: +500 for pinned items
 * - breakingBonus: +300 for breaking news
 * - recencyBoost: 100 - (ageHours * 2) — decays over 24h
 * - engagementBoost: log(views+1)*10 + log(votes+1)*15
 */
@Injectable()
export class FeedAlgorithmService {
  /**
   * Base priority weights by content type.
   * Higher weight = appears higher in feed (all else being equal).
   */
  private readonly TYPE_WEIGHTS: Record<FeedItemType, number> = {
    [FeedItemType.ELECTION_UPDATE]: 1000, // Highest priority
    [FeedItemType.DAILY_QUIZ]: 900, // High priority — daily engagement
    [FeedItemType.ARTICLE]: 500,
    [FeedItemType.POLL]: 400,
    [FeedItemType.EVENT]: 300,
    [FeedItemType.QUIZ_PROMPT]: 200,
    [FeedItemType.COMPANY_AD]: 0, // injected positionally, not by score
    [FeedItemType.CANDIDATE_AD]: 0, // injected positionally, not by score
  };

  /**
   * Compute priority score for a feed item.
   */
  computePriority(item: FeedItemDto): number {
    let priority = 0;

    // 1. Base type weight
    priority += this.TYPE_WEIGHTS[item.type] || 0;

    // 2. Pinned bonus (+500)
    if (item.isPinned) {
      priority += 500;
    }

    // 3. Breaking news bonus (+300)
    if (item.type === FeedItemType.ARTICLE && item.article?.isBreaking) {
      priority += 300;
    }

    // 4. Live election bonus (+300)
    if (
      item.type === FeedItemType.ELECTION_UPDATE &&
      item.electionUpdate?.isLive
    ) {
      priority += 300;
    }

    // 5. Recency boost (decays over 24 hours)
    const ageHours = this.getAgeHours(item.publishedAt);
    const recencyBoost = Math.max(0, 100 - ageHours * 2);
    priority += recencyBoost;

    // 6. Engagement boost (logarithmic scale)
    priority += this.computeEngagementBoost(item);

    return Math.round(priority);
  }

  // ─────────────────────────────────────────────────────────────────
  // Personalized Priority
  // ─────────────────────────────────────────────────────────────────

  /**
   * Compute personalized priority score for a feed item based on user follows.
   *
   * Formula:
   *   score = base_recency_score (10 for items < 1 hour, decaying)
   *         + (followed_category ? +3 : 0)
   *         + (followed_member   ? +5 : 0)   — per matching member
   *         + (followed_author   ? +4 : 0)
   *         + (followed_tag      ? +2 : 0)   — per matching tag
   *         + recency_decay                   — -1 per hour (max -24)
   *         + popularity_boost                — min(viewCount / 100, 5)
   *
   * Non-article items receive base_recency_score + recency_decay only
   * (no follow-based boosts, since follows apply to article metadata).
   */
  computePersonalizedPriority(
    item: FeedItemDto,
    userFollows: UserFollowsMap,
  ): number {
    let score = 0;

    // 1. Base recency score: 10 for items < 1 hour old, decaying by 1 per hour
    const ageHours = this.getAgeHours(item.publishedAt);
    score += Math.max(0, 10 - Math.floor(ageHours));

    // 2. Follow-based boosts (articles only — follow data maps to article metadata)
    if (item.type === FeedItemType.ARTICLE && item.article) {
      // Category follow boost (+3)
      if (item.article.categoryId && userFollows.categories.has(item.article.categoryId)) {
        score += 3;
      }

      // Member follow boost (+5 per matching member)
      if (item.article.memberIds && item.article.memberIds.length > 0) {
        for (const memberId of item.article.memberIds) {
          if (userFollows.members.has(memberId)) {
            score += 5;
          }
        }
      }

      // Author follow boost (+4)
      if (item.article.authorId && userFollows.authors.has(item.article.authorId)) {
        score += 4;
      }

      // Tag follow boost (+2 per matching tag)
      if (item.article.tagIds && item.article.tagIds.length > 0) {
        for (const tagId of item.article.tagIds) {
          if (userFollows.tags.has(tagId)) {
            score += 2;
          }
        }
      }

      // Popularity boost: viewCount / 100, capped at +5
      score += Math.min((item.article.viewCount || 0) / 100, 5);
    }

    // 3. Recency decay: -1 per hour since publish, capped at -24
    const decay = Math.min(Math.floor(ageHours), 24);
    score -= decay;

    return score;
  }

  /**
   * Compute engagement boost based on views, votes, RSVPs, etc.
   */
  private computeEngagementBoost(item: FeedItemDto): number {
    let boost = 0;

    switch (item.type) {
      case FeedItemType.ARTICLE:
        if (item.article) {
          // Article: views + comments + shares
          boost += Math.log(item.article.viewCount + 1) * 10;
          boost += Math.log(item.article.commentCount + 1) * 15;
          boost += Math.log(item.article.shareCount + 1) * 5;
        }
        break;

      case FeedItemType.POLL:
        if (item.poll) {
          // Poll: total votes
          boost += Math.log(item.poll.totalVotes + 1) * 15;
        }
        break;

      case FeedItemType.EVENT:
        if (item.event) {
          // Event: RSVP count
          boost += Math.log(item.event.rsvpCount + 1) * 12;
        }
        break;

      case FeedItemType.ELECTION_UPDATE:
        if (item.electionUpdate) {
          // Election: actual voters
          boost += Math.log((item.electionUpdate.actualVoters || 0) + 1) * 20;
        }
        break;

      case FeedItemType.QUIZ_PROMPT:
        if (item.quizPrompt) {
          // Quiz: completion rate
          boost += (item.quizPrompt.completionRate || 0) * 50;
        }
        break;
    }

    return boost;
  }

  /**
   * Get age of content in hours.
   */
  private getAgeHours(publishedAt: Date): number {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now.getTime() - published.getTime();
    return diffMs / (1000 * 60 * 60);
  }

  /**
   * Interleave different content types for optimal feed diversity.
   *
   * Pattern: 5 articles → 1 poll → 2 articles → 1 event → repeat
   *
   * This ensures:
   * - Articles dominate (majority of content)
   * - Polls appear regularly (every 6-7 items)
   * - Events are sprinkled in (every 8-9 items)
   * - Elections/quizzes appear based on priority
   */
  interleave(items: FeedItemDto[]): FeedItemDto[] {
    // Separate by type
    const articles = items.filter((i) => i.type === FeedItemType.ARTICLE);
    const polls = items.filter((i) => i.type === FeedItemType.POLL);
    const events = items.filter((i) => i.type === FeedItemType.EVENT);
    const elections = items.filter(
      (i) => i.type === FeedItemType.ELECTION_UPDATE,
    );
    const quizzes = items.filter((i) => i.type === FeedItemType.QUIZ_PROMPT);
    const dailyQuizzes = items.filter(
      (i) => i.type === FeedItemType.DAILY_QUIZ,
    );

    const result: FeedItemDto[] = [];

    // Daily quiz goes at the very top (high-priority engagement item)
    result.push(...dailyQuizzes);
    let articleIdx = 0;
    let pollIdx = 0;
    let eventIdx = 0;
    let electionIdx = 0;
    let quizIdx = 0;

    // Articles are the backbone — interleave others between them.
    // Pattern per cycle: [election?] 5 articles, 1 poll, 2 articles, 1 event
    // When articles run out, append remaining non-article items at the end.
    while (articleIdx < articles.length) {
      // Elections go first (if any available)
      if (electionIdx < elections.length) {
        result.push(elections[electionIdx++]);
      }

      // 5 articles
      for (let i = 0; i < 5 && articleIdx < articles.length; i++) {
        result.push(articles[articleIdx++]);
      }

      // 1 poll between articles
      if (pollIdx < polls.length) {
        result.push(polls[pollIdx++]);
      }

      // 2 more articles
      for (let i = 0; i < 2 && articleIdx < articles.length; i++) {
        result.push(articles[articleIdx++]);
      }

      // 1 event between articles
      if (eventIdx < events.length) {
        result.push(events[eventIdx++]);
      }

      // 1 quiz prompt every ~20 items
      if (quizIdx < quizzes.length && result.length % 20 < 10) {
        result.push(quizzes[quizIdx++]);
      }
    }

    // Append any remaining non-article items at the end
    while (electionIdx < elections.length) result.push(elections[electionIdx++]);
    while (pollIdx < polls.length) result.push(polls[pollIdx++]);
    while (eventIdx < events.length) result.push(events[eventIdx++]);
    while (quizIdx < quizzes.length) result.push(quizzes[quizIdx++]);

    return result;
  }

  /**
   * Apply cardinality limits to prevent content type saturation.
   *
   * Limits:
   * - Max 2 polls per page
   * - Max 3 events per page
   * - Max 1 election update per page
   * - Max 1 quiz prompt per page
   * - Unlimited articles
   */
  applyCardinalityLimits(
    items: FeedItemDto[],
    limit: number,
  ): FeedItemDto[] {
    const result: FeedItemDto[] = [];
    const counts: Record<FeedItemType, number> = {
      [FeedItemType.ARTICLE]: 0,
      [FeedItemType.POLL]: 0,
      [FeedItemType.EVENT]: 0,
      [FeedItemType.ELECTION_UPDATE]: 0,
      [FeedItemType.QUIZ_PROMPT]: 0,
      [FeedItemType.DAILY_QUIZ]: 0,
      [FeedItemType.COMPANY_AD]: 0,
      [FeedItemType.CANDIDATE_AD]: 0,
    };

    const limits: Record<FeedItemType, number> = {
      [FeedItemType.ARTICLE]: Infinity,
      [FeedItemType.POLL]: 2,
      [FeedItemType.EVENT]: 2,
      [FeedItemType.ELECTION_UPDATE]: 1,
      [FeedItemType.QUIZ_PROMPT]: 1,
      [FeedItemType.DAILY_QUIZ]: 1,
      [FeedItemType.COMPANY_AD]: Infinity, // injected positionally, not capped here
      [FeedItemType.CANDIDATE_AD]: Infinity, // injected positionally, not capped here
    };

    for (const item of items) {
      if (result.length >= limit) break;

      const typeCount = counts[item.type];
      const typeLimit = limits[item.type];

      if (typeCount < typeLimit) {
        result.push(item);
        counts[item.type]++;
      }
    }

    return result;
  }
}
