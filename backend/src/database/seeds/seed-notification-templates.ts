import { DataSource } from 'typeorm';
import { NotificationTemplate } from '../../modules/notifications/entities/notification-template.entity';
import { NotificationContentType } from '../../modules/notifications/enums/notification.enums';
import { User } from '../../modules/users/entities/user.entity';

const templates: Partial<NotificationTemplate>[] = [
  {
    name: 'article_published',
    titleTemplate: 'כתבה חדשה',
    bodyTemplate: '{{article_title}}',
    imageUrlTemplate: '{{hero_image_url}}',
    contentType: NotificationContentType.ARTICLE,
    triggerEvent: 'article.published',
    isAutoTrigger: true,
    defaultAudience: { type: 'all', notificationPrefKey: 'article_updates' },
    variables: [
      { name: 'article_title', required: true, description: 'כותרת הכתבה' },
      { name: 'article_slug', required: true, description: 'Slug של הכתבה' },
      { name: 'category_name', required: false, description: 'שם הקטגוריה' },
      { name: 'hero_image_url', required: false, description: 'תמונת כותרת' },
    ],
    isActive: true,
  },
  {
    name: 'article_breaking',
    titleTemplate: 'מבזק',
    bodyTemplate: '{{article_title}}',
    imageUrlTemplate: '{{hero_image_url}}',
    contentType: NotificationContentType.ARTICLE,
    triggerEvent: 'article.breaking_published',
    isAutoTrigger: true,
    defaultAudience: { type: 'all', notificationPrefKey: 'breaking_news' },
    variables: [
      { name: 'article_title', required: true, description: 'כותרת הכתבה' },
      { name: 'article_slug', required: true, description: 'Slug של הכתבה' },
      { name: 'hero_image_url', required: false, description: 'תמונת כותרת' },
    ],
    isActive: true,
  },
  {
    name: 'poll_created',
    titleTemplate: 'סקר חדש',
    bodyTemplate: '{{poll_question}}',
    contentType: NotificationContentType.POLL,
    triggerEvent: 'poll.created',
    isAutoTrigger: true,
    defaultAudience: { type: 'all', notificationPrefKey: 'article_updates' },
    variables: [
      { name: 'poll_question', required: true, description: 'שאלת הסקר' },
    ],
    isActive: true,
  },
  {
    name: 'event_created',
    titleTemplate: 'אירוע חדש',
    bodyTemplate: '{{event_title}} - {{event_location}}',
    contentType: NotificationContentType.EVENT,
    triggerEvent: 'event.created',
    isAutoTrigger: true,
    defaultAudience: { type: 'all', notificationPrefKey: 'campaign_events' },
    variables: [
      { name: 'event_title', required: true, description: 'שם האירוע' },
      { name: 'event_location', required: true, description: 'מיקום האירוע' },
    ],
    isActive: true,
  },
  {
    name: 'election_voting',
    titleTemplate: 'הבחירות החלו!',
    bodyTemplate: '{{election_title}} - הצביעו עכשיו',
    contentType: NotificationContentType.ELECTION,
    triggerEvent: 'election.voting_started',
    isAutoTrigger: true,
    defaultAudience: { type: 'all', notificationPrefKey: 'membership_updates' },
    variables: [
      { name: 'election_title', required: true, description: 'שם הבחירות' },
    ],
    isActive: true,
  },
  {
    name: 'quiz_activated',
    titleTemplate: 'שאלון התאמה חדש',
    bodyTemplate: '{{quiz_title}} - {{questions_count}} שאלות',
    contentType: NotificationContentType.QUIZ,
    triggerEvent: 'quiz.activated',
    isAutoTrigger: true,
    defaultAudience: { type: 'all', notificationPrefKey: 'article_updates' },
    variables: [
      { name: 'quiz_title', required: true, description: 'שם השאלון' },
      { name: 'questions_count', required: true, description: 'מספר השאלות' },
    ],
    isActive: true,
  },
  {
    name: 'story_created',
    titleTemplate: 'סיפור חדש',
    bodyTemplate: '{{story_title}}',
    imageUrlTemplate: '{{story_image_url}}',
    contentType: NotificationContentType.CUSTOM,
    triggerEvent: 'story.created',
    isAutoTrigger: true,
    defaultAudience: { type: 'all', notificationPrefKey: 'article_updates' },
    variables: [
      { name: 'story_title', required: true, description: 'כותרת הסיפור' },
      { name: 'story_image_url', required: false, description: 'תמונת הסיפור' },
    ],
    isActive: true,
  },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'likud',
    password: process.env.DB_PASSWORD || 'likud_dev',
    database: process.env.DB_DATABASE || 'likud_news',
    entities: [NotificationTemplate, User],
    synchronize: false,
  });

  await dataSource.initialize();
  const repo = dataSource.getRepository(NotificationTemplate);

  for (const tmpl of templates) {
    const existing = await repo.findOne({ where: { name: tmpl.name } });
    if (!existing) {
      await repo.save(repo.create(tmpl));
      console.log(`  Created template: ${tmpl.name}`);
    } else {
      console.log(`  Template already exists: ${tmpl.name}`);
    }
  }

  console.log('Notification templates seeded successfully');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
