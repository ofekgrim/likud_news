import { Test, TestingModule } from '@nestjs/testing';
import { FeedAlgorithmService } from './feed-algorithm.service';
import { FeedItemDto, FeedItemType } from './dto/feed-item.dto';

/**
 * Helper to create a FeedItemDto with sensible defaults.
 * All fields can be overridden via the `overrides` parameter.
 */
function createFeedItem(
  overrides: Partial<FeedItemDto> & { type?: FeedItemType } = {},
): FeedItemDto {
  const type = overrides.type ?? FeedItemType.ARTICLE;
  const base: FeedItemDto = {
    id: overrides.id ?? `feed-${Math.random().toString(36).slice(2, 8)}`,
    type,
    publishedAt: overrides.publishedAt ?? new Date(),
    isPinned: overrides.isPinned ?? false,
    sortPriority: overrides.sortPriority ?? 0,
  };

  // Attach type-specific defaults if not provided
  if (type === FeedItemType.ARTICLE && !overrides.article) {
    base.article = {
      id: 'art-1',
      title: 'כותרת מאמר',
      slug: 'test-article',
      isBreaking: false,
      viewCount: 0,
      commentCount: 0,
      shareCount: 0,
      readingTimeMinutes: 3,
      publishedAt: base.publishedAt,
    };
  }

  if (type === FeedItemType.POLL && !overrides.poll) {
    base.poll = {
      id: 'poll-1',
      question: 'שאלת סקר',
      options: [],
      totalVotes: 0,
      isActive: true,
      allowMultipleVotes: false,
    };
  }

  if (type === FeedItemType.EVENT && !overrides.event) {
    base.event = {
      id: 'event-1',
      title: 'אירוע',
      startTime: new Date(),
      rsvpCount: 0,
    };
  }

  if (type === FeedItemType.ELECTION_UPDATE && !overrides.electionUpdate) {
    base.electionUpdate = {
      id: 'elec-1',
      electionId: 'election-1',
      electionName: 'בחירות לראשות',
      isLive: false,
      lastUpdated: new Date(),
    };
  }

  if (type === FeedItemType.QUIZ_PROMPT && !overrides.quizPrompt) {
    base.quizPrompt = {
      id: 'quiz-1',
      title: 'חידון',
      questionsCount: 10,
    };
  }

  if (type === FeedItemType.DAILY_QUIZ && !overrides.dailyQuiz) {
    base.dailyQuiz = {
      id: 'daily-1',
      date: '2026-03-10',
      questionsCount: 5,
      pointsReward: 100,
      userHasCompleted: false,
    };
  }

  return { ...base, ...overrides };
}

describe('FeedAlgorithmService', () => {
  let service: FeedAlgorithmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedAlgorithmService],
    }).compile();

    service = module.get<FeedAlgorithmService>(FeedAlgorithmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────
  // computePriority
  // ─────────────────────────────────────────────────────────────────
  describe('computePriority', () => {
    describe('base type weights', () => {
      it('should assign weight 1000 to ELECTION_UPDATE', () => {
        const item = createFeedItem({
          type: FeedItemType.ELECTION_UPDATE,
          publishedAt: new Date(), // recent => recency boost ~100
        });
        const score = service.computePriority(item);
        // 1000 base + ~100 recency + 0 engagement
        expect(score).toBeGreaterThanOrEqual(1000);
        expect(score).toBeLessThan(1200);
      });

      it('should assign weight 900 to DAILY_QUIZ', () => {
        const item = createFeedItem({ type: FeedItemType.DAILY_QUIZ });
        const score = service.computePriority(item);
        expect(score).toBeGreaterThanOrEqual(900);
        expect(score).toBeLessThan(1100);
      });

      it('should assign weight 500 to ARTICLE', () => {
        const item = createFeedItem({ type: FeedItemType.ARTICLE });
        const score = service.computePriority(item);
        expect(score).toBeGreaterThanOrEqual(500);
        expect(score).toBeLessThan(700);
      });

      it('should assign weight 400 to POLL', () => {
        const item = createFeedItem({ type: FeedItemType.POLL });
        const score = service.computePriority(item);
        expect(score).toBeGreaterThanOrEqual(400);
        expect(score).toBeLessThan(600);
      });

      it('should assign weight 300 to EVENT', () => {
        const item = createFeedItem({ type: FeedItemType.EVENT });
        const score = service.computePriority(item);
        expect(score).toBeGreaterThanOrEqual(300);
        expect(score).toBeLessThan(500);
      });

      it('should assign weight 200 to QUIZ_PROMPT', () => {
        const item = createFeedItem({ type: FeedItemType.QUIZ_PROMPT });
        const score = service.computePriority(item);
        expect(score).toBeGreaterThanOrEqual(200);
        expect(score).toBeLessThan(400);
      });

      it('should rank ELECTION_UPDATE higher than ARTICLE when all else equal', () => {
        const now = new Date();
        const election = createFeedItem({
          type: FeedItemType.ELECTION_UPDATE,
          publishedAt: now,
        });
        const article = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
        });
        expect(service.computePriority(election)).toBeGreaterThan(
          service.computePriority(article),
        );
      });
    });

    describe('pinned bonus', () => {
      it('should add 500 for pinned items', () => {
        const now = new Date();
        const unpinned = createFeedItem({
          type: FeedItemType.ARTICLE,
          isPinned: false,
          publishedAt: now,
        });
        const pinned = createFeedItem({
          type: FeedItemType.ARTICLE,
          isPinned: true,
          publishedAt: now,
        });
        expect(service.computePriority(pinned) - service.computePriority(unpinned)).toBe(500);
      });
    });

    describe('breaking news bonus', () => {
      it('should add 300 for breaking articles', () => {
        const now = new Date();
        const regular = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'רגיל',
            slug: 'regular',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 3,
            publishedAt: now,
          },
        });
        const breaking = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-2',
            title: 'מבזק',
            slug: 'breaking',
            isBreaking: true,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 3,
            publishedAt: now,
          },
        });
        expect(
          service.computePriority(breaking) - service.computePriority(regular),
        ).toBe(300);
      });

      it('should not add breaking bonus to non-article types', () => {
        const now = new Date();
        const poll = createFeedItem({
          type: FeedItemType.POLL,
          publishedAt: now,
        });
        const score = service.computePriority(poll);
        // Should just be base (400) + recency (~100), no +300
        expect(score).toBeLessThan(600);
      });
    });

    describe('live election bonus', () => {
      it('should add 300 for live elections', () => {
        const now = new Date();
        const notLive = createFeedItem({
          type: FeedItemType.ELECTION_UPDATE,
          publishedAt: now,
          electionUpdate: {
            id: 'e-1',
            electionId: 'el-1',
            electionName: 'בחירות',
            isLive: false,
            lastUpdated: now,
          },
        });
        const live = createFeedItem({
          type: FeedItemType.ELECTION_UPDATE,
          publishedAt: now,
          electionUpdate: {
            id: 'e-2',
            electionId: 'el-2',
            electionName: 'בחירות חיות',
            isLive: true,
            lastUpdated: now,
          },
        });
        expect(
          service.computePriority(live) - service.computePriority(notLive),
        ).toBe(300);
      });
    });

    describe('recency boost', () => {
      it('should give ~100 boost to a just-published item', () => {
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: new Date(),
          article: {
            id: 'art-1',
            title: 'חדש',
            slug: 'new',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 3,
            publishedAt: new Date(),
          },
        });
        const score = service.computePriority(item);
        // 500 base + ~100 recency + 0 engagement = ~600
        expect(score).toBeGreaterThanOrEqual(595);
        expect(score).toBeLessThanOrEqual(600);
      });

      it('should give 0 recency boost to items older than 50 hours', () => {
        const oldDate = new Date(Date.now() - 60 * 60 * 60 * 1000); // 60 hours ago
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: oldDate,
          article: {
            id: 'art-1',
            title: 'ישן',
            slug: 'old',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 3,
            publishedAt: oldDate,
          },
        });
        const score = service.computePriority(item);
        // 500 base + 0 recency + 0 engagement = 500
        expect(score).toBe(500);
      });

      it('should decay recency boost linearly over time', () => {
        const now = Date.now();
        const item10h = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: new Date(now - 10 * 60 * 60 * 1000), // 10h ago
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: new Date(now - 10 * 60 * 60 * 1000),
          },
        });
        const item30h = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: new Date(now - 30 * 60 * 60 * 1000), // 30h ago
          article: {
            id: 'art-2',
            title: 'b',
            slug: 'b',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: new Date(now - 30 * 60 * 60 * 1000),
          },
        });
        const score10h = service.computePriority(item10h);
        const score30h = service.computePriority(item30h);

        // 10h: 500 + (100-20) = 580
        // 30h: 500 + (100-60) = 540
        expect(score10h).toBeGreaterThan(score30h);
        // Difference should be roughly 40 (20h * 2 per hour)
        expect(score10h - score30h).toBeCloseTo(40, 0);
      });
    });

    describe('engagement boost', () => {
      it('should boost articles based on views, comments, and shares', () => {
        const now = new Date();
        const noEngagement = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const highEngagement = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-2',
            title: 'b',
            slug: 'b',
            isBreaking: false,
            viewCount: 10000,
            commentCount: 500,
            shareCount: 200,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        expect(service.computePriority(highEngagement)).toBeGreaterThan(
          service.computePriority(noEngagement),
        );
      });

      it('should boost polls based on totalVotes', () => {
        const now = new Date();
        const noVotes = createFeedItem({
          type: FeedItemType.POLL,
          publishedAt: now,
          poll: {
            id: 'poll-1',
            question: 'q',
            options: [],
            totalVotes: 0,
            isActive: true,
            allowMultipleVotes: false,
          },
        });
        const manyVotes = createFeedItem({
          type: FeedItemType.POLL,
          publishedAt: now,
          poll: {
            id: 'poll-2',
            question: 'q2',
            options: [],
            totalVotes: 5000,
            isActive: true,
            allowMultipleVotes: false,
          },
        });
        expect(service.computePriority(manyVotes)).toBeGreaterThan(
          service.computePriority(noVotes),
        );
      });

      it('should boost events based on rsvpCount', () => {
        const now = new Date();
        const noRsvp = createFeedItem({
          type: FeedItemType.EVENT,
          publishedAt: now,
          event: {
            id: 'ev-1',
            title: 'e1',
            startTime: now,
            rsvpCount: 0,
          },
        });
        const manyRsvp = createFeedItem({
          type: FeedItemType.EVENT,
          publishedAt: now,
          event: {
            id: 'ev-2',
            title: 'e2',
            startTime: now,
            rsvpCount: 3000,
          },
        });
        expect(service.computePriority(manyRsvp)).toBeGreaterThan(
          service.computePriority(noRsvp),
        );
      });

      it('should boost elections based on actualVoters', () => {
        const now = new Date();
        const noVoters = createFeedItem({
          type: FeedItemType.ELECTION_UPDATE,
          publishedAt: now,
          electionUpdate: {
            id: 'el-1',
            electionId: 'e-1',
            electionName: 'n',
            isLive: false,
            lastUpdated: now,
            actualVoters: 0,
          },
        });
        const manyVoters = createFeedItem({
          type: FeedItemType.ELECTION_UPDATE,
          publishedAt: now,
          electionUpdate: {
            id: 'el-2',
            electionId: 'e-2',
            electionName: 'n2',
            isLive: false,
            lastUpdated: now,
            actualVoters: 100000,
          },
        });
        expect(service.computePriority(manyVoters)).toBeGreaterThan(
          service.computePriority(noVoters),
        );
      });

      it('should boost quiz prompts based on completionRate', () => {
        const now = new Date();
        const noCompletion = createFeedItem({
          type: FeedItemType.QUIZ_PROMPT,
          publishedAt: now,
          quizPrompt: {
            id: 'qz-1',
            title: 'q',
            questionsCount: 10,
            completionRate: 0,
          },
        });
        const highCompletion = createFeedItem({
          type: FeedItemType.QUIZ_PROMPT,
          publishedAt: now,
          quizPrompt: {
            id: 'qz-2',
            title: 'q2',
            questionsCount: 10,
            completionRate: 0.8,
          },
        });
        expect(service.computePriority(highCompletion)).toBeGreaterThan(
          service.computePriority(noCompletion),
        );
      });

      it('should use logarithmic scaling for engagement', () => {
        const now = new Date();
        const make = (views: number) =>
          createFeedItem({
            type: FeedItemType.ARTICLE,
            publishedAt: now,
            article: {
              id: `art-${views}`,
              title: 'a',
              slug: 'a',
              isBreaking: false,
              viewCount: views,
              commentCount: 0,
              shareCount: 0,
              readingTimeMinutes: 1,
              publishedAt: now,
            },
          });

        const score100 = service.computePriority(make(100));
        const score1000 = service.computePriority(make(1000));
        const score10000 = service.computePriority(make(10000));

        // Each 10x increase should yield a diminishing return
        const diff1 = score1000 - score100;
        const diff2 = score10000 - score1000;
        expect(diff2).toBeLessThan(diff1 * 1.5); // logarithmic, not linear
        expect(diff2).toBeGreaterThan(0); // but still increasing
      });
    });

    describe('combined scoring', () => {
      it('should combine all factors correctly', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          isPinned: true,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'מבזק',
            slug: 'breaking',
            isBreaking: true,
            viewCount: 1000,
            commentCount: 50,
            shareCount: 20,
            readingTimeMinutes: 3,
            publishedAt: now,
          },
        });
        const score = service.computePriority(item);
        // 500 base + 500 pinned + 300 breaking + ~100 recency + engagement > 1400
        expect(score).toBeGreaterThan(1400);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // interleave
  // ─────────────────────────────────────────────────────────────────
  describe('interleave', () => {
    it('should place daily quizzes first', () => {
      const items = [
        createFeedItem({ id: 'art-1', type: FeedItemType.ARTICLE }),
        createFeedItem({ id: 'dq-1', type: FeedItemType.DAILY_QUIZ }),
        createFeedItem({ id: 'art-2', type: FeedItemType.ARTICLE }),
      ];
      const result = service.interleave(items);
      expect(result[0].type).toBe(FeedItemType.DAILY_QUIZ);
    });

    it('should place multiple daily quizzes before other content', () => {
      const items = [
        createFeedItem({ id: 'art-1', type: FeedItemType.ARTICLE }),
        createFeedItem({ id: 'dq-1', type: FeedItemType.DAILY_QUIZ }),
        createFeedItem({ id: 'dq-2', type: FeedItemType.DAILY_QUIZ }),
        createFeedItem({ id: 'poll-1', type: FeedItemType.POLL }),
      ];
      const result = service.interleave(items);
      expect(result[0].type).toBe(FeedItemType.DAILY_QUIZ);
      expect(result[1].type).toBe(FeedItemType.DAILY_QUIZ);
    });

    it('should interleave articles with polls and events in correct pattern', () => {
      // Create enough articles and non-article items to see the pattern
      const articles = Array.from({ length: 10 }, (_, i) =>
        createFeedItem({ id: `art-${i}`, type: FeedItemType.ARTICLE }),
      );
      const polls = [
        createFeedItem({ id: 'poll-1', type: FeedItemType.POLL }),
      ];
      const events = [
        createFeedItem({ id: 'event-1', type: FeedItemType.EVENT }),
      ];

      const items = [...articles, ...polls, ...events];
      const result = service.interleave(items);

      // Pattern: [election?] 5 articles, 1 poll, 2 articles, 1 event
      // No election, so: 5 articles, 1 poll, 2 articles, 1 event, then remaining articles
      expect(result.length).toBe(12); // 10 articles + 1 poll + 1 event

      // First 5 should be articles
      for (let i = 0; i < 5; i++) {
        expect(result[i].type).toBe(FeedItemType.ARTICLE);
      }
      // 6th should be the poll
      expect(result[5].type).toBe(FeedItemType.POLL);
      // 7th and 8th should be articles
      expect(result[6].type).toBe(FeedItemType.ARTICLE);
      expect(result[7].type).toBe(FeedItemType.ARTICLE);
      // 9th should be the event
      expect(result[8].type).toBe(FeedItemType.EVENT);
    });

    it('should place elections at the start of each cycle', () => {
      const articles = Array.from({ length: 5 }, (_, i) =>
        createFeedItem({ id: `art-${i}`, type: FeedItemType.ARTICLE }),
      );
      const election = createFeedItem({
        id: 'elec-1',
        type: FeedItemType.ELECTION_UPDATE,
      });

      const items = [...articles, election];
      const result = service.interleave(items);

      // Election should be placed at start of first cycle (before articles)
      expect(result[0].type).toBe(FeedItemType.ELECTION_UPDATE);
      expect(result[1].type).toBe(FeedItemType.ARTICLE);
    });

    it('should return empty array for empty input', () => {
      const result = service.interleave([]);
      expect(result).toEqual([]);
    });

    it('should handle only non-article items', () => {
      const items = [
        createFeedItem({ id: 'poll-1', type: FeedItemType.POLL }),
        createFeedItem({ id: 'event-1', type: FeedItemType.EVENT }),
      ];
      const result = service.interleave(items);
      // No articles means the while loop never runs; these go to the "remaining" appenders
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.type)).toContain(FeedItemType.POLL);
      expect(result.map((r) => r.type)).toContain(FeedItemType.EVENT);
    });

    it('should append remaining non-article items at the end', () => {
      const articles = Array.from({ length: 3 }, (_, i) =>
        createFeedItem({ id: `art-${i}`, type: FeedItemType.ARTICLE }),
      );
      const polls = Array.from({ length: 3 }, (_, i) =>
        createFeedItem({ id: `poll-${i}`, type: FeedItemType.POLL }),
      );

      const items = [...articles, ...polls];
      const result = service.interleave(items);

      // All items should be present
      expect(result).toHaveLength(6);
      // Remaining polls appended at end
      const lastItem = result[result.length - 1];
      expect(lastItem.type).toBe(FeedItemType.POLL);
    });

    it('should preserve all items without dropping any', () => {
      const items = [
        createFeedItem({ id: 'dq-1', type: FeedItemType.DAILY_QUIZ }),
        createFeedItem({ id: 'elec-1', type: FeedItemType.ELECTION_UPDATE }),
        ...Array.from({ length: 8 }, (_, i) =>
          createFeedItem({ id: `art-${i}`, type: FeedItemType.ARTICLE }),
        ),
        createFeedItem({ id: 'poll-1', type: FeedItemType.POLL }),
        createFeedItem({ id: 'poll-2', type: FeedItemType.POLL }),
        createFeedItem({ id: 'event-1', type: FeedItemType.EVENT }),
        createFeedItem({ id: 'quiz-1', type: FeedItemType.QUIZ_PROMPT }),
      ];
      const result = service.interleave(items);
      expect(result).toHaveLength(items.length);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // applyCardinalityLimits
  // ─────────────────────────────────────────────────────────────────
  describe('applyCardinalityLimits', () => {
    it('should allow unlimited articles', () => {
      const items = Array.from({ length: 20 }, (_, i) =>
        createFeedItem({ id: `art-${i}`, type: FeedItemType.ARTICLE }),
      );
      const result = service.applyCardinalityLimits(items, 50);
      expect(result).toHaveLength(20);
    });

    it('should limit polls to max 2', () => {
      const items = Array.from({ length: 5 }, (_, i) =>
        createFeedItem({ id: `poll-${i}`, type: FeedItemType.POLL }),
      );
      const result = service.applyCardinalityLimits(items, 50);
      expect(result).toHaveLength(2);
    });

    it('should limit events to max 2', () => {
      const items = Array.from({ length: 5 }, (_, i) =>
        createFeedItem({ id: `event-${i}`, type: FeedItemType.EVENT }),
      );
      const result = service.applyCardinalityLimits(items, 50);
      expect(result).toHaveLength(2);
    });

    it('should limit election updates to max 1', () => {
      const items = Array.from({ length: 3 }, (_, i) =>
        createFeedItem({
          id: `elec-${i}`,
          type: FeedItemType.ELECTION_UPDATE,
        }),
      );
      const result = service.applyCardinalityLimits(items, 50);
      expect(result).toHaveLength(1);
    });

    it('should limit quiz prompts to max 1', () => {
      const items = Array.from({ length: 3 }, (_, i) =>
        createFeedItem({ id: `quiz-${i}`, type: FeedItemType.QUIZ_PROMPT }),
      );
      const result = service.applyCardinalityLimits(items, 50);
      expect(result).toHaveLength(1);
    });

    it('should limit daily quizzes to max 1', () => {
      const items = Array.from({ length: 2 }, (_, i) =>
        createFeedItem({ id: `dq-${i}`, type: FeedItemType.DAILY_QUIZ }),
      );
      const result = service.applyCardinalityLimits(items, 50);
      expect(result).toHaveLength(1);
    });

    it('should respect the overall limit parameter', () => {
      const items = Array.from({ length: 20 }, (_, i) =>
        createFeedItem({ id: `art-${i}`, type: FeedItemType.ARTICLE }),
      );
      const result = service.applyCardinalityLimits(items, 10);
      expect(result).toHaveLength(10);
    });

    it('should apply both per-type and overall limits together', () => {
      const items = [
        ...Array.from({ length: 10 }, (_, i) =>
          createFeedItem({ id: `art-${i}`, type: FeedItemType.ARTICLE }),
        ),
        ...Array.from({ length: 5 }, (_, i) =>
          createFeedItem({ id: `poll-${i}`, type: FeedItemType.POLL }),
        ),
        ...Array.from({ length: 4 }, (_, i) =>
          createFeedItem({ id: `event-${i}`, type: FeedItemType.EVENT }),
        ),
        ...Array.from({ length: 3 }, (_, i) =>
          createFeedItem({
            id: `elec-${i}`,
            type: FeedItemType.ELECTION_UPDATE,
          }),
        ),
        createFeedItem({ id: 'dq-1', type: FeedItemType.DAILY_QUIZ }),
        createFeedItem({ id: 'dq-2', type: FeedItemType.DAILY_QUIZ }),
      ];

      const result = service.applyCardinalityLimits(items, 50);

      const typeCounts = result.reduce(
        (acc, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      expect(typeCounts[FeedItemType.ARTICLE]).toBe(10);
      expect(typeCounts[FeedItemType.POLL]).toBe(2);
      expect(typeCounts[FeedItemType.EVENT]).toBe(2);
      expect(typeCounts[FeedItemType.ELECTION_UPDATE]).toBe(1);
      expect(typeCounts[FeedItemType.DAILY_QUIZ]).toBe(1);
    });

    it('should skip items that exceed per-type limit and continue', () => {
      const items = [
        createFeedItem({ id: 'poll-1', type: FeedItemType.POLL }),
        createFeedItem({ id: 'poll-2', type: FeedItemType.POLL }),
        createFeedItem({ id: 'poll-3', type: FeedItemType.POLL }), // should be skipped
        createFeedItem({ id: 'art-1', type: FeedItemType.ARTICLE }), // should still be included
      ];
      const result = service.applyCardinalityLimits(items, 50);
      expect(result).toHaveLength(3); // 2 polls + 1 article
      expect(result.map((r) => r.id)).toEqual(['poll-1', 'poll-2', 'art-1']);
    });

    it('should return empty array for empty input', () => {
      const result = service.applyCardinalityLimits([], 10);
      expect(result).toEqual([]);
    });

    it('should return all items if under all limits', () => {
      const items = [
        createFeedItem({ id: 'art-1', type: FeedItemType.ARTICLE }),
        createFeedItem({ id: 'poll-1', type: FeedItemType.POLL }),
        createFeedItem({ id: 'event-1', type: FeedItemType.EVENT }),
        createFeedItem({ id: 'elec-1', type: FeedItemType.ELECTION_UPDATE }),
        createFeedItem({ id: 'dq-1', type: FeedItemType.DAILY_QUIZ }),
        createFeedItem({ id: 'quiz-1', type: FeedItemType.QUIZ_PROMPT }),
      ];
      const result = service.applyCardinalityLimits(items, 50);
      expect(result).toHaveLength(6);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // computePersonalizedPriority
  // ─────────────────────────────────────────────────────────────────
  describe('computePersonalizedPriority', () => {
    /**
     * Helper to create a UserFollowsMap with optional overrides.
     */
    function createFollowsMap(overrides: Partial<{
      categories: string[];
      members: string[];
      authors: string[];
      tags: string[];
    }> = {}) {
      return {
        categories: new Set(overrides.categories || []),
        members: new Set(overrides.members || []),
        authors: new Set(overrides.authors || []),
        tags: new Set(overrides.tags || []),
      };
    }

    describe('base recency score', () => {
      it('should give 10 for a just-published item', () => {
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: new Date(),
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: new Date(),
          },
        });
        const emptyFollows = createFollowsMap();
        const score = service.computePersonalizedPriority(item, emptyFollows);
        // base_recency = 10, decay = 0, no follows, no popularity
        expect(score).toBe(10);
      });

      it('should decay base recency by 1 per hour', () => {
        const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: fiveHoursAgo,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: fiveHoursAgo,
          },
        });
        const emptyFollows = createFollowsMap();
        const score = service.computePersonalizedPriority(item, emptyFollows);
        // base_recency = max(0, 10 - 5) = 5, decay = -5
        expect(score).toBe(0);
      });

      it('should give 0 base recency for items older than 10 hours', () => {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: twelveHoursAgo,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: twelveHoursAgo,
          },
        });
        const emptyFollows = createFollowsMap();
        const score = service.computePersonalizedPriority(item, emptyFollows);
        // base_recency = 0, decay = -12 => score = -12
        expect(score).toBe(-12);
      });
    });

    describe('recency decay', () => {
      it('should cap decay at -24 for very old items', () => {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: fortyEightHoursAgo,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: fortyEightHoursAgo,
          },
        });
        const emptyFollows = createFollowsMap();
        const score = service.computePersonalizedPriority(item, emptyFollows);
        // base_recency = 0, decay = -24 (capped) => score = -24
        expect(score).toBe(-24);
      });
    });

    describe('category follow boost', () => {
      it('should add +3 when article category is followed', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            categoryId: 'cat-1',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const follows = createFollowsMap({ categories: ['cat-1'] });
        const noFollows = createFollowsMap();

        const scoreWith = service.computePersonalizedPriority(item, follows);
        const scoreWithout = service.computePersonalizedPriority(item, noFollows);

        expect(scoreWith - scoreWithout).toBe(3);
      });

      it('should not boost when category does not match', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            categoryId: 'cat-1',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const follows = createFollowsMap({ categories: ['cat-999'] });
        const noFollows = createFollowsMap();

        const scoreWith = service.computePersonalizedPriority(item, follows);
        const scoreWithout = service.computePersonalizedPriority(item, noFollows);

        expect(scoreWith).toBe(scoreWithout);
      });
    });

    describe('member follow boost', () => {
      it('should add +5 per matching member', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            memberIds: ['member-1', 'member-2'],
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });

        // Follow both members
        const followsBoth = createFollowsMap({ members: ['member-1', 'member-2'] });
        const followsOne = createFollowsMap({ members: ['member-1'] });
        const noFollows = createFollowsMap();

        const scoreBoth = service.computePersonalizedPriority(item, followsBoth);
        const scoreOne = service.computePersonalizedPriority(item, followsOne);
        const scoreNone = service.computePersonalizedPriority(item, noFollows);

        expect(scoreBoth - scoreNone).toBe(10); // +5 per member
        expect(scoreOne - scoreNone).toBe(5);
      });

      it('should not boost when no members match', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            memberIds: ['member-1'],
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const follows = createFollowsMap({ members: ['member-999'] });
        const noFollows = createFollowsMap();

        expect(
          service.computePersonalizedPriority(item, follows),
        ).toBe(
          service.computePersonalizedPriority(item, noFollows),
        );
      });
    });

    describe('author follow boost', () => {
      it('should add +4 when article author is followed', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            authorId: 'author-1',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const follows = createFollowsMap({ authors: ['author-1'] });
        const noFollows = createFollowsMap();

        const scoreWith = service.computePersonalizedPriority(item, follows);
        const scoreWithout = service.computePersonalizedPriority(item, noFollows);

        expect(scoreWith - scoreWithout).toBe(4);
      });
    });

    describe('tag follow boost', () => {
      it('should add +2 per matching tag', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            tagIds: ['tag-1', 'tag-2', 'tag-3'],
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const followsTwo = createFollowsMap({ tags: ['tag-1', 'tag-3'] });
        const followsOne = createFollowsMap({ tags: ['tag-2'] });
        const noFollows = createFollowsMap();

        const scoreTwo = service.computePersonalizedPriority(item, followsTwo);
        const scoreOne = service.computePersonalizedPriority(item, followsOne);
        const scoreNone = service.computePersonalizedPriority(item, noFollows);

        expect(scoreTwo - scoreNone).toBe(4); // +2 per tag
        expect(scoreOne - scoreNone).toBe(2);
      });
    });

    describe('popularity boost', () => {
      it('should add viewCount / 100, capped at 5', () => {
        const now = new Date();
        const makeFeedItem = (viewCount: number) =>
          createFeedItem({
            type: FeedItemType.ARTICLE,
            publishedAt: now,
            article: {
              id: `art-${viewCount}`,
              title: 'a',
              slug: 'a',
              isBreaking: false,
              viewCount,
              commentCount: 0,
              shareCount: 0,
              readingTimeMinutes: 1,
              publishedAt: now,
            },
          });
        const emptyFollows = createFollowsMap();

        const score0 = service.computePersonalizedPriority(makeFeedItem(0), emptyFollows);
        const score200 = service.computePersonalizedPriority(makeFeedItem(200), emptyFollows);
        const score500 = service.computePersonalizedPriority(makeFeedItem(500), emptyFollows);
        const score1000 = service.computePersonalizedPriority(makeFeedItem(1000), emptyFollows);

        // 0 views => +0, 200 views => +2, 500 views => +5, 1000 views => +5 (capped)
        expect(score200 - score0).toBe(2);
        expect(score500 - score0).toBe(5);
        expect(score1000 - score0).toBe(5); // capped at 5
      });
    });

    describe('non-article items', () => {
      it('should only apply recency to polls (no follow boosts)', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.POLL,
          publishedAt: now,
        });
        const heavyFollows = createFollowsMap({
          categories: ['cat-1'],
          members: ['member-1'],
          authors: ['author-1'],
          tags: ['tag-1'],
        });

        const score = service.computePersonalizedPriority(item, heavyFollows);
        // base_recency = 10, decay = 0 => 10 (no follow boosts for polls)
        expect(score).toBe(10);
      });

      it('should only apply recency to events (no follow boosts)', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.EVENT,
          publishedAt: now,
        });
        const heavyFollows = createFollowsMap({
          categories: ['cat-1'],
          members: ['member-1'],
        });

        const score = service.computePersonalizedPriority(item, heavyFollows);
        expect(score).toBe(10);
      });
    });

    describe('combined scoring', () => {
      it('should stack all follow boosts correctly', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'Full boost article',
            slug: 'full-boost',
            categoryId: 'cat-1',
            authorId: 'author-1',
            memberIds: ['member-1'],
            tagIds: ['tag-1'],
            isBreaking: false,
            viewCount: 500, // popularity boost = 5 (capped)
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 3,
            publishedAt: now,
          },
        });
        const allFollows = createFollowsMap({
          categories: ['cat-1'],
          members: ['member-1'],
          authors: ['author-1'],
          tags: ['tag-1'],
        });

        const score = service.computePersonalizedPriority(item, allFollows);
        // base_recency = 10
        // category = +3
        // member = +5
        // author = +4
        // tag = +2
        // popularity = +5 (500/100 = 5, capped at 5)
        // decay = 0
        // total = 29
        expect(score).toBe(29);
      });

      it('should rank followed content higher than unfollowed content', () => {
        const now = new Date();
        const followedItem = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-followed',
            title: 'Followed',
            slug: 'followed',
            categoryId: 'cat-1',
            authorId: 'author-1',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const unfollowedItem = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-unfollowed',
            title: 'Unfollowed',
            slug: 'unfollowed',
            categoryId: 'cat-2',
            authorId: 'author-2',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const follows = createFollowsMap({
          categories: ['cat-1'],
          authors: ['author-1'],
        });

        const followedScore = service.computePersonalizedPriority(followedItem, follows);
        const unfollowedScore = service.computePersonalizedPriority(unfollowedItem, follows);

        expect(followedScore).toBeGreaterThan(unfollowedScore);
        // Difference should be category(3) + author(4) = 7
        expect(followedScore - unfollowedScore).toBe(7);
      });

      it('should allow popularity to partially compensate for lack of follows', () => {
        const now = new Date();
        const unfollowedPopular = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-popular',
            title: 'Popular',
            slug: 'popular',
            categoryId: 'cat-2',
            isBreaking: false,
            viewCount: 1000, // +5 popularity
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const followedUnpopular = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-unpopular',
            title: 'Unpopular',
            slug: 'unpopular',
            categoryId: 'cat-1',
            isBreaking: false,
            viewCount: 0, // +0 popularity
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const follows = createFollowsMap({ categories: ['cat-1'] });

        const popularScore = service.computePersonalizedPriority(unfollowedPopular, follows);
        const followedScore = service.computePersonalizedPriority(followedUnpopular, follows);

        // Popular but unfollowed: 10 + 5 (popularity) = 15
        // Followed but unpopular: 10 + 3 (category) = 13
        expect(popularScore).toBeGreaterThan(followedScore);
      });

      it('should handle articles with empty member/tag arrays', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            memberIds: [],
            tagIds: [],
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const follows = createFollowsMap({
          members: ['member-1'],
          tags: ['tag-1'],
        });

        // Should not throw and should not boost
        const score = service.computePersonalizedPriority(item, follows);
        expect(score).toBe(10); // just base recency
      });

      it('should handle articles with undefined member/tag fields', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            // memberIds and tagIds are undefined
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const follows = createFollowsMap({
          members: ['member-1'],
          tags: ['tag-1'],
        });

        const score = service.computePersonalizedPriority(item, follows);
        expect(score).toBe(10);
      });

      it('should handle empty follows map correctly', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-1',
            title: 'a',
            slug: 'a',
            categoryId: 'cat-1',
            authorId: 'author-1',
            memberIds: ['member-1'],
            tagIds: ['tag-1'],
            isBreaking: false,
            viewCount: 300,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });
        const emptyFollows = createFollowsMap();

        const score = service.computePersonalizedPriority(item, emptyFollows);
        // base_recency = 10 + popularity(3) + decay(0) = 13
        expect(score).toBe(13);
      });

      it('should use default scoring (recency + popularity only) with no follows', () => {
        const now = new Date();
        const noFollows = createFollowsMap();

        const itemWithMetadata = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-full',
            title: 'Full Metadata',
            slug: 'full',
            categoryId: 'cat-1',
            authorId: 'author-1',
            memberIds: ['m-1', 'm-2'],
            tagIds: ['t-1', 't-2'],
            isBreaking: false,
            viewCount: 500,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 2,
            publishedAt: now,
          },
        });

        const itemWithoutMetadata = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-bare',
            title: 'Bare Article',
            slug: 'bare',
            isBreaking: false,
            viewCount: 500,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 2,
            publishedAt: now,
          },
        });

        // With no follows, both should score the same (only recency + popularity matter)
        const scoreWithMeta = service.computePersonalizedPriority(itemWithMetadata, noFollows);
        const scoreWithout = service.computePersonalizedPriority(itemWithoutMetadata, noFollows);

        expect(scoreWithMeta).toBe(scoreWithout);
        // Both: base=10, popularity=5 (500/100 capped), decay=0 => 15
        expect(scoreWithMeta).toBe(15);
      });

      it('should compare 1hr old vs 24hr old recency decay correctly', () => {
        const emptyFollows = createFollowsMap();
        const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const recentItem = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: oneHourAgo,
          article: {
            id: 'art-recent',
            title: 'Recent',
            slug: 'recent',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: oneHourAgo,
          },
        });

        const oldItem = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: twentyFourHoursAgo,
          article: {
            id: 'art-old',
            title: 'Old',
            slug: 'old',
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: twentyFourHoursAgo,
          },
        });

        const recentScore = service.computePersonalizedPriority(recentItem, emptyFollows);
        const oldScore = service.computePersonalizedPriority(oldItem, emptyFollows);

        // 1hr: base=max(0,10-1)=9, decay=-1 => 8
        // 24hr: base=max(0,10-24)=0, decay=-24 => -24
        expect(recentScore).toBeGreaterThan(oldScore);
        expect(recentScore).toBe(8);
        expect(oldScore).toBe(-24);
      });

      it('should stack multiple matching follow types for same article', () => {
        const now = new Date();
        const item = createFeedItem({
          type: FeedItemType.ARTICLE,
          publishedAt: now,
          article: {
            id: 'art-multi',
            title: 'Multi Follow',
            slug: 'multi',
            categoryId: 'cat-1',
            authorId: 'author-1',
            memberIds: ['member-1', 'member-2'],
            tagIds: ['tag-1', 'tag-2', 'tag-3'],
            isBreaking: false,
            viewCount: 0,
            commentCount: 0,
            shareCount: 0,
            readingTimeMinutes: 1,
            publishedAt: now,
          },
        });

        // Follow everything
        const fullFollows = createFollowsMap({
          categories: ['cat-1'],
          authors: ['author-1'],
          members: ['member-1', 'member-2'],
          tags: ['tag-1', 'tag-2', 'tag-3'],
        });

        const score = service.computePersonalizedPriority(item, fullFollows);
        // base=10, category=+3, author=+4, members=+5*2=10, tags=+2*3=6, decay=0
        // total = 10 + 3 + 4 + 10 + 6 = 33
        expect(score).toBe(33);
      });
    });
  });
});
