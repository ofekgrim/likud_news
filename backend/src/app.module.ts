import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import configuration from './config/configuration';
import { ReadableTypeOrmLogger } from './common/logger/typeorm.logger';

// Entities
import { Article } from './modules/articles/entities/article.entity';
import { Category } from './modules/categories/entities/category.entity';
import { Member } from './modules/members/entities/member.entity';
import { TickerItem } from './modules/ticker/entities/ticker-item.entity';
import { User } from './modules/users/entities/user.entity';
import { Media } from './modules/media/entities/media.entity';
import { ContactMessage } from './modules/contact/entities/contact-message.entity';
import { UserFavorite } from './modules/favorites/entities/user-favorite.entity';
import { ReadingHistory } from './modules/history/entities/reading-history.entity';
import { PushToken } from './modules/push/entities/push-token.entity';
import { Comment } from './modules/comments/entities/comment.entity';
import { Author } from './modules/authors/entities/author.entity';
import { Tag } from './modules/tags/entities/tag.entity';
import { Story } from './modules/stories/entities/story.entity';

// New entities (Module A — User Accounts)
import { AppUser } from './modules/app-users/entities/app-user.entity';
import { VotingEligibility } from './modules/app-users/entities/voting-eligibility.entity';
import { RefreshToken } from './modules/app-auth/entities/refresh-token.entity';
import { OtpCode } from './modules/app-auth/entities/otp-code.entity';
import { EmailVerification } from './modules/app-auth/entities/email-verification.entity';
import { BookmarkFolder } from './modules/bookmark-folders/entities/bookmark-folder.entity';
import { UserFollow } from './modules/user-follows/entities/user-follow.entity';

// Primaries entities
import { PrimaryElection } from './modules/elections/entities/primary-election.entity';
import { Candidate } from './modules/candidates/entities/candidate.entity';
import { CandidateEndorsement } from './modules/endorsements/entities/candidate-endorsement.entity';
import { QuizQuestion } from './modules/quiz/entities/quiz-question.entity';
import { QuizResponse } from './modules/quiz/entities/quiz-response.entity';
import { CampaignEvent } from './modules/campaign-events/entities/campaign-event.entity';
import { EventRsvp } from './modules/campaign-events/entities/event-rsvp.entity';
import { UserPoints } from './modules/gamification/entities/user-points.entity';
import { UserBadge } from './modules/gamification/entities/user-badge.entity';
import { UserStreak } from './modules/gamification/entities/user-streak.entity';
import { DailyQuiz } from './modules/gamification/entities/daily-quiz.entity';
import { DailyQuizAttempt } from './modules/gamification/entities/daily-quiz-attempt.entity';
import { PollingStation } from './modules/polling-stations/entities/polling-station.entity';
import { StationReport } from './modules/polling-stations/entities/station-report.entity';
import { ElectionResult } from './modules/election-results/entities/election-result.entity';
import { TurnoutSnapshot } from './modules/election-results/entities/turnout-snapshot.entity';
import { CommunityPoll } from './modules/community-polls/entities/community-poll.entity';
import { PollVote } from './modules/community-polls/entities/poll-vote.entity';
import { ArticleAnalytics } from './modules/article-analytics/entities/article-analytics.entity';

// Notification entities
import { NotificationTemplate } from './modules/notifications/entities/notification-template.entity';
import { NotificationLog } from './modules/notifications/entities/notification-log.entity';
import { NotificationSchedule } from './modules/notifications/entities/notification-schedule.entity';
import { NotificationReceipt } from './modules/notifications/entities/notification-receipt.entity';

// Feature modules
import { ArticlesModule } from './modules/articles/articles.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { MembersModule } from './modules/members/members.module';
import { TickerModule } from './modules/ticker/ticker.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MediaModule } from './modules/media/media.module';
import { ContactModule } from './modules/contact/contact.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { HistoryModule } from './modules/history/history.module';
import { PushModule } from './modules/push/push.module';
import { SseModule } from './modules/sse/sse.module';
import { SearchModule } from './modules/search/search.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AuthorsModule } from './modules/authors/authors.module';
import { TagsModule } from './modules/tags/tags.module';
import { StoriesModule } from './modules/stories/stories.module';

// New modules (Module A — User Accounts)
import { AppAuthModule } from './modules/app-auth/app-auth.module';
import { AppUsersModule } from './modules/app-users/app-users.module';
import { BookmarkFoldersModule } from './modules/bookmark-folders/bookmark-folders.module';
import { UserFollowsModule } from './modules/user-follows/user-follows.module';

// Primaries modules
import { ElectionsModule } from './modules/elections/elections.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { EndorsementsModule } from './modules/endorsements/endorsements.module';
import { QuizModule } from './modules/quiz/quiz.module';
import { CampaignEventsModule } from './modules/campaign-events/campaign-events.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { PollingStationsModule } from './modules/polling-stations/polling-stations.module';
import { ElectionResultsModule } from './modules/election-results/election-results.module';
import { CommunityPollsModule } from './modules/community-polls/community-polls.module';
import { ArticleAnalyticsModule } from './modules/article-analytics/article-analytics.module';
import { FeedModule } from './modules/feed/feed.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // Cache (Redis with graceful fallback to memory)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        try {
          // Try to connect to Redis
          const store = await redisStore({
            socket: {
              host: config.get<string>('redis.host', 'localhost'),
              port: config.get<number>('redis.port', 6379),
            },
            ttl: 2 * 60 * 1000, // Default TTL: 2 minutes (in milliseconds)
          });
          console.log('✅ Cache: Connected to Redis');
          return { store };
        } catch (error) {
          // Fallback to in-memory cache if Redis is unavailable
          console.warn(
            '⚠️  Cache: Redis unavailable, using in-memory cache (development only)',
          );
          return {
            ttl: 2 * 60 * 1000, // Default TTL: 2 minutes
            max: 100, // Maximum number of items in cache
          };
        }
      },
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        database: config.get<string>('database.name'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        ssl: config.get<boolean>('database.ssl'),
        synchronize: config.get<boolean>('database.synchronize'),
        logging: config.get<boolean>('database.logging')
          ? 'all'
          : ['error', 'warn', 'schema', 'migration'],
        logger: config.get<boolean>('database.logging')
          ? new ReadableTypeOrmLogger()
          : undefined,
        maxQueryExecutionTime: 500, // log slow queries > 500ms
        entities: [
          Article,
          Category,
          Member,
          TickerItem,
          User,
          Media,
          ContactMessage,
          UserFavorite,
          ReadingHistory,
          PushToken,
          Comment,
          Author,
          Tag,
          Story,
          // Module A entities
          AppUser,
          RefreshToken,
          OtpCode,
          EmailVerification,
          BookmarkFolder,
          UserFollow,
          VotingEligibility,
          // Primaries entities
          PrimaryElection,
          Candidate,
          CandidateEndorsement,
          QuizQuestion,
          QuizResponse,
          CampaignEvent,
          EventRsvp,
          UserPoints,
          UserBadge,
          UserStreak,
          DailyQuiz,
          DailyQuizAttempt,
          // Polling & Results entities
          PollingStation,
          StationReport,
          ElectionResult,
          TurnoutSnapshot,
          CommunityPoll,
          PollVote,
          ArticleAnalytics,
          // Notification entities
          NotificationTemplate,
          NotificationLog,
          NotificationSchedule,
          NotificationReceipt,
        ],
        migrations: ['dist/database/migrations/*{.ts,.js}'],
      }),
    }),

    // Feature modules
    ArticlesModule,
    CategoriesModule,
    MembersModule,
    TickerModule,
    AuthModule,
    UsersModule,
    MediaModule,
    ContactModule,
    FavoritesModule,
    HistoryModule,
    PushModule,
    SseModule,
    SearchModule,
    CommentsModule,
    AuthorsModule,
    TagsModule,
    StoriesModule,
    FeedModule,

    // Module A — User Accounts
    AppAuthModule,
    AppUsersModule,
    BookmarkFoldersModule,
    UserFollowsModule,

    // Primaries
    ElectionsModule,
    CandidatesModule,
    EndorsementsModule,
    QuizModule,
    CampaignEventsModule,
    GamificationModule,
    PollingStationsModule,
    ElectionResultsModule,
    CommunityPollsModule,
    ArticleAnalyticsModule,

    // Notifications
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
