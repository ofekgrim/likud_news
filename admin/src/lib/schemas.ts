import { z } from 'zod';

export const memberSchema = z.object({
  name: z.string().min(1, 'שם נדרש').max(200),
  nameEn: z.string().max(200).optional().or(z.literal('')),
  title: z.string().max(300).optional().or(z.literal('')),
  titleEn: z.string().max(300).optional().or(z.literal('')),
  bio: z.string().optional().or(z.literal('')),
  photoUrl: z.string().max(2000).optional().or(z.literal('')),
  socialTwitter: z.string().max(500).optional().or(z.literal('')),
  socialFacebook: z.string().max(500).optional().or(z.literal('')),
  socialInstagram: z.string().max(500).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const userSchema = z.object({
  email: z.string().email('כתובת דוא"ל לא תקינה'),
  name: z.string().min(1, 'שם נדרש'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
  role: z.enum(['super_admin', 'admin', 'editor']),
});

export const userUpdateSchema = z.object({
  email: z.string().email('כתובת דוא"ל לא תקינה'),
  name: z.string().min(1, 'שם נדרש'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים').optional().or(z.literal('')),
  role: z.enum(['super_admin', 'admin', 'editor']),
});

export const pushNotificationSchema = z.object({
  title: z.string().min(1, 'כותרת נדרשת'),
  body: z.string().min(1, 'תוכן נדרש'),
  imageUrl: z.string().optional().or(z.literal('')),
  articleSlug: z.string().optional().or(z.literal('')),
});

export const tickerSchema = z.object({
  text: z.string().min(1, 'טקסט נדרש').max(500),
  linkUrl: z.string().max(2000).optional().or(z.literal('')),
  articleId: z.string().optional().or(z.literal('')),
  position: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  expiresAt: z.string().optional().or(z.literal('')),
});

export type MemberFormData = z.infer<typeof memberSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;
export type PushNotificationFormData = z.infer<typeof pushNotificationSchema>;
export type TickerFormData = z.infer<typeof tickerSchema>;
