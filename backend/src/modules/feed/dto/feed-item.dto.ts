import { ApiProperty } from '@nestjs/swagger';

/**
 * Feed item type discriminator.
 * Used to determine which content type is present in the feed item.
 */
export enum FeedItemType {
  ARTICLE = 'article',
  POLL = 'poll',
  EVENT = 'event',
  ELECTION_UPDATE = 'election_update',
  QUIZ_PROMPT = 'quiz_prompt',
  DAILY_QUIZ = 'daily_quiz',
}

/**
 * Unified feed item DTO with discriminated union pattern.
 *
 * Each feed item has a type field that indicates which content type is present.
 * Only one of the content fields (article, poll, event, etc.) will be non-null.
 *
 * This allows the frontend to render different card types in a single feed
 * while maintaining type safety and efficient serialization.
 */
export class FeedItemDto {
  @ApiProperty({
    description: 'Unique identifier for this feed item',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Type of content in this feed item',
    enum: FeedItemType,
    example: FeedItemType.ARTICLE,
  })
  type: FeedItemType;

  @ApiProperty({
    description: 'Publication/creation timestamp',
    example: '2026-02-26T10:00:00Z',
  })
  publishedAt: Date;

  @ApiProperty({
    description: 'Whether this item is pinned to the top',
    example: false,
  })
  isPinned: boolean;

  @ApiProperty({
    description: 'Computed priority score for sorting (higher = more important)',
    example: 850,
  })
  sortPriority: number;

  // ─────────────────────────────────────────────────────────────────
  // Discriminated Union Fields (only one is non-null based on 'type')
  // ─────────────────────────────────────────────────────────────────

  @ApiProperty({
    description: 'Article content (present when type=article)',
    required: false,
  })
  article?: {
    id: string;
    title: string;
    titleEn?: string;
    subtitle?: string;
    heroImageUrl?: string;
    categoryName?: string;
    categoryColor?: string;
    isBreaking: boolean;
    viewCount: number;
    commentCount: number;
    shareCount: number;
    readingTimeMinutes: number;
    publishedAt: Date;
    slug: string;
    author?: string;
    authorEntityName?: string;
  };

  @ApiProperty({
    description: 'Community poll content (present when type=poll)',
    required: false,
  })
  poll?: {
    id: string;
    question: string;
    questionEn?: string;
    options: Array<{
      id: string;
      text: string;
      textEn?: string;
      votesCount: number;
      percentage: number;
    }>;
    totalVotes: number;
    endsAt?: Date;
    isActive: boolean;
    allowMultipleVotes: boolean;
    userHasVoted?: boolean;
    votedOptionIndex?: number | null;
  };

  @ApiProperty({
    description: 'Campaign event content (present when type=event)',
    required: false,
  })
  event?: {
    id: string;
    title: string;
    titleEn?: string;
    description?: string;
    imageUrl?: string;
    location?: string;
    locationEn?: string;
    startTime: Date;
    endTime?: Date;
    rsvpCount: number;
    maxAttendees?: number;
    userHasRsvped?: boolean;
    eventType?: string;
  };

  @ApiProperty({
    description: 'Election update content (present when type=election_update)',
    required: false,
  })
  electionUpdate?: {
    id: string;
    electionId: string;
    electionName: string;
    electionNameEn?: string;
    turnoutPercentage?: number;
    eligibleVoters?: number;
    actualVoters?: number;
    isLive: boolean;
    topCandidates?: Array<{
      id: string;
      name: string;
      votesCount: number;
      percentage: number;
      imageUrl?: string;
    }>;
    lastUpdated: Date;
  };

  @ApiProperty({
    description: 'Quiz prompt content (present when type=quiz_prompt)',
    required: false,
  })
  quizPrompt?: {
    id: string;
    title: string;
    titleEn?: string;
    description?: string;
    imageUrl?: string;
    questionsCount: number;
    completionRate?: number;
    userHasCompleted?: boolean;
    userMatchPercentage?: number;
  };

  @ApiProperty({
    description: 'Daily quiz content (present when type=daily_quiz)',
    required: false,
  })
  dailyQuiz?: {
    id: string;
    date: string;
    questionsCount: number;
    pointsReward: number;
    userHasCompleted: boolean;
    userScore?: number;
  };
}
