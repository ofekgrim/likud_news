export interface Article {
  id: string;
  title: string;
  titleEn?: string;
  subtitle?: string;
  content: string;
  contentEn?: string;
  heroImageUrl?: string;
  heroImageCaption?: string;
  author?: string;
  hashtags?: string;
  status: 'draft' | 'published' | 'archived';
  isHero: boolean;
  isBreaking: boolean;
  viewCount: number;
  slug: string;
  publishedAt?: string;
  categoryId?: string;
  category?: Category;
  members?: Member[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  iconUrl?: string;
  sortOrder: number;
  isActive: boolean;
  color?: string;
}

export interface Member {
  id: string;
  name: string;
  nameEn?: string;
  title?: string;
  titleEn?: string;
  bio?: string;
  photoUrl?: string;
  socialTwitter?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface TickerItem {
  id: string;
  text: string;
  linkUrl?: string;
  articleId?: string;
  position: number;
  isActive: boolean;
  expiresAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'editor';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  s3Key: string;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  caption?: string;
  altText?: string;
  articleId?: string;
  createdAt: string;
}

export interface PresignResponse {
  uploadUrl: string;
  s3Key: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
