import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';

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

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
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
        logging: config.get<boolean>('database.logging'),
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
