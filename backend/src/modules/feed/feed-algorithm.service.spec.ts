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
});
