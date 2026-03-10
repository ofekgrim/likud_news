export enum NotificationContentType {
  ARTICLE = 'article',
  POLL = 'poll',
  EVENT = 'event',
  ELECTION = 'election',
  QUIZ = 'quiz',
  CUSTOM = 'custom',
}

export enum NotificationLogStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum NotificationScheduleType {
  ONCE = 'once',
  RECURRING = 'recurring',
}

export enum NotificationReceiptStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  FAILED = 'failed',
}
