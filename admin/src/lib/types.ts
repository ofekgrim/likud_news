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
  bodyBlocks?: ContentBlock[];
  alertBannerText?: string;
  alertBannerEnabled?: boolean;
  alertBannerColor?: string;
  heroImageCredit?: string;
  heroImageCaptionHe?: string;
  heroImageFullUrl?: string;
  authorId?: string;
  authorEntity?: Author;
  tagIds?: string[];
  tags?: Tag[];
  allowComments?: boolean;
  readingTimeMinutes?: number;
  shareCount?: number;
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

// ── Authors ──────────────────────────────────────────────────────────────

export interface Author {
  id: string;
  nameHe: string;
  nameEn?: string;
  roleHe?: string;
  roleEn?: string;
  bioHe?: string;
  avatarUrl?: string;
  avatarThumbnailUrl?: string;
  email?: string;
  socialLinks?: Record<string, string>;
  userId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Tags ─────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  nameHe: string;
  nameEn?: string;
  slug: string;
  tagType: 'topic' | 'person' | 'location';
  createdAt: string;
}

// ── Comments ─────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  articleId: string;
  parentId?: string;
  authorName: string;
  authorEmail?: string;
  body: string;
  isApproved: boolean;
  isPinned: boolean;
  likesCount: number;
  createdAt: string;
  replies?: Comment[];
  article?: { id: string; title: string; slug: string };
}

// ── Stories ──────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  durationSeconds: number;
  mediaType: 'image' | 'video';
  linkUrl?: string;
  articleId?: string;
  linkedArticleId?: string;
  article?: { id: string; title: string; slug: string };
  linkedArticle?: { id: string; title: string; slug: string };
  sortOrder: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Content Block Types (Block Editor) ───────────────────────────────────

export type ContentBlockType =
  | 'paragraph'
  | 'heading'
  | 'image'
  | 'youtube'
  | 'tweet'
  | 'quote'
  | 'divider'
  | 'bullet_list'
  | 'article_link'
  | 'video';

export interface BaseBlock {
  id: string;
  type: ContentBlockType;
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  text: string;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  text: string;
  level: 2 | 3 | 4;
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  fullUrl?: string;
  credit?: string;
  captionHe?: string;
  captionEn?: string;
  altText?: string;
}

export interface YouTubeBlock extends BaseBlock {
  type: 'youtube';
  videoId: string;
  caption?: string;
  credit?: string;
}

export interface TweetBlock extends BaseBlock {
  type: 'tweet';
  tweetId: string;
  authorHandle?: string;
  previewText?: string;
  caption?: string;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  text: string;
  attribution?: string;
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
}

export interface BulletListBlock extends BaseBlock {
  type: 'bullet_list';
  items: string[];
}

export interface ArticleLinkBlock extends BaseBlock {
  type: 'article_link';
  linkedArticleId: string;
  displayStyle: 'card' | 'inline';
  linkedArticle?: { title: string; heroImageUrl?: string; slug: string };
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  source: 'youtube' | 'upload';
  videoId?: string;
  url?: string;
  thumbnailUrl?: string;
  caption?: string;
  credit?: string;
  mimeType?: string;
}

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | YouTubeBlock
  | TweetBlock
  | QuoteBlock
  | DividerBlock
  | BulletListBlock
  | ArticleLinkBlock
  | VideoBlock;
