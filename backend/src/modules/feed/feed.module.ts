import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedAlgorithmService } from './feed-algorithm.service';
import { SseModule } from '../sse/sse.module';

// Import entities from other modules
import { Article } from '../articles/entities/article.entity';
import { CommunityPoll } from '../community-polls/entities/community-poll.entity';
import { CampaignEvent } from '../campaign-events/entities/campaign-event.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { Comment } from '../comments/entities/comment.entity';

/**
 * Feed module - provides unified mixed-content feed.
 *
 * Dependencies:
 * - Articles: For news articles
 * - Community Polls: For user engagement polls
 * - Campaign Events: For upcoming events
 * - Elections: For primary election updates
 * - Quiz: For candidate quiz prompts
 * - Comments: For article comment counts
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Article,
      CommunityPoll,
      CampaignEvent,
      PrimaryElection,
      QuizQuestion,
      Comment,
    ]),
    SseModule, // Import SSE module for real-time feed updates
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedAlgorithmService],
  exports: [FeedService], // Export for potential use in other modules (articles, polls, etc.)
})
export class FeedModule {}
