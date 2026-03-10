import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedAlgorithmService } from './feed-algorithm.service';
import { SseModule } from '../sse/sse.module';
import { ElectionResultsModule } from '../election-results/election-results.module';
import { CandidatesModule } from '../candidates/candidates.module';

// Import entities from other modules
import { Article } from '../articles/entities/article.entity';
import { CommunityPoll } from '../community-polls/entities/community-poll.entity';
import { CampaignEvent } from '../campaign-events/entities/campaign-event.entity';
import { PrimaryElection } from '../elections/entities/primary-election.entity';
import { QuizQuestion } from '../quiz/entities/quiz-question.entity';
import { Comment } from '../comments/entities/comment.entity';
import { PollVote } from '../community-polls/entities/poll-vote.entity';
import { EventRsvp } from '../campaign-events/entities/event-rsvp.entity';
import { QuizResponse } from '../quiz/entities/quiz-response.entity';
import { DailyQuiz } from '../gamification/entities/daily-quiz.entity';
import { DailyQuizAttempt } from '../gamification/entities/daily-quiz-attempt.entity';

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
      PollVote,
      EventRsvp,
      QuizResponse,
      DailyQuiz,
      DailyQuizAttempt,
    ]),
    SseModule, // Import SSE module for real-time feed updates
    ElectionResultsModule, // For real-time turnout + results in feed
    CandidatesModule, // For candidate data in election feed items
  ],
  controllers: [FeedController],
  providers: [FeedService, FeedAlgorithmService],
  exports: [FeedService], // Export for potential use in other modules (articles, polls, etc.)
})
export class FeedModule {}
