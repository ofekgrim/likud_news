export interface NotificationContext {
  /** Template variable key-value pairs, e.g. { article_title: 'Breaking News' } */
  variables: Record<string, string>;
}

export interface AudienceRules {
  type: 'all' | 'targeted' | 'specific_users';
  roles?: string[];
  membershipStatuses?: string[];
  preferredCategories?: string[];
  userIds?: string[];
  excludeUserIds?: string[];
  platforms?: string[];
  notificationPrefKey?: string;
}

export interface TemplateVariable {
  name: string;
  required: boolean;
  description: string;
}

export interface ResolvedNotification {
  title: string;
  body: string;
  imageUrl?: string;
}
