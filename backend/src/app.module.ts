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
        host: config.get('database.host'),
        port: config.get('database.port'),
        database: config.get('database.name'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        ssl: config.get('database.ssl'),
        synchronize: config.get('database.synchronize'),
        logging: config.get('database.logging'),
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
        ],
        migrations: ['dist/database/migrations/*{.ts,.js}'],
      }),
    }),

    // Feature modules will be added here as they are built:
    // ArticlesModule,
    // CategoriesModule,
    // MembersModule,
    // TickerModule,
    // AuthModule,
    // UsersModule,
    // MediaModule,
    // ContactModule,
    // FavoritesModule,
    // HistoryModule,
    // PushModule,
    // SseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
