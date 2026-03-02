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
  bioEn?: string;
  bioBlocks?: ContentBlock[];
  photoUrl?: string;
  socialTwitter?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  slug?: string;
  office?: string;
  phone?: string;
  email?: string;
  website?: string;
  coverImageUrl?: string;
  personalPageHtml?: string;
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
  | 'instagram'
  | 'facebook'
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

export interface InstagramBlock extends BaseBlock {
  type: 'instagram';
  postUrl: string;
  caption?: string;
}

export interface FacebookBlock extends BaseBlock {
  type: 'facebook';
  postUrl: string;
  caption?: string;
}

export type ContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | YouTubeBlock
  | TweetBlock
  | InstagramBlock
  | FacebookBlock
  | QuoteBlock
  | DividerBlock
  | BulletListBlock
  | ArticleLinkBlock
  | VideoBlock;

// ── App Users (Mobile App) ──────────────────────────────────────────────

export interface AppUser {
  id: string;
  phone?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  role: 'guest' | 'member' | 'verified_member';
  membershipId?: string;
  membershipStatus: 'unverified' | 'pending' | 'verified' | 'expired';
  membershipVerifiedAt?: string;
  preferredCategories: string[];
  notificationPrefs: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  votingEligibility?: VotingEligibility[];
}

export interface VotingEligibility {
  id: string;
  userId: string;
  electionId: string;
  approvedBy?: string;
  approvedAt: string;
  election?: PrimaryElection;
}

export interface AppUsersResponse {
  data: AppUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Primaries: Elections ─────────────────────────────────────────────────

export interface PrimaryElection {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  electionDate: string;
  registrationDeadline?: string;
  status: 'draft' | 'upcoming' | 'active' | 'voting' | 'completed' | 'cancelled';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Primaries: Candidates ────────────────────────────────────────────────

export interface PrimaryCandidate {
  id: string;
  fullName: string;
  slug: string;
  district?: string;
  position?: string;
  photoUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  bioBlocks?: ContentBlock[];
  socialLinks?: Record<string, string>;
  phone?: string;
  email?: string;
  website?: string;
  quizPositions?: Record<string, number>;
  endorsementCount: number;
  isActive: boolean;
  electionId: string;
  election?: PrimaryElection;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ── Primaries: Endorsements ──────────────────────────────────────────────

export interface CandidateEndorsement {
  id: string;
  userId: string;
  candidateId: string;
  electionId: string;
  candidate?: PrimaryCandidate;
  user?: { displayName?: string; phone?: string };
  createdAt: string;
}

// ── Primaries: Quiz ──────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  electionId: string;
  questionText: string;
  questionTextEn?: string;
  options: { value: number; label: string; labelEn?: string }[];
  importanceLevel: 'low' | 'medium' | 'high';
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface QuizResponse {
  id: string;
  userId: string;
  electionId: string;
  answers: { questionId: string; selectedValue: number; importance: number }[];
  matchResults: { candidateId: string; candidateName: string; matchPercentage: number }[];
  completedAt: string;
  user?: { id: string; displayName?: string; phone?: string; email?: string; avatarUrl?: string };
}

// ── Primaries: Polling Stations ──────────────────────────────────────────

export interface PollingStation {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string;
  latitude: number;
  longitude: number;
  capacity?: number;
  isAccessible: boolean;
  openTime?: string;
  closeTime?: string;
  electionId: string;
  isActive: boolean;
  createdAt: string;
}

// ── Primaries: Election Results ──────────────────────────────────────────

export interface ElectionResult {
  id: string;
  candidateId: string;
  stationId?: string;
  electionId: string;
  voteCount: number;
  isOfficial: boolean;
  candidate?: PrimaryCandidate;
  station?: PollingStation;
  createdAt: string;
}

export interface TurnoutSnapshot {
  id: string;
  electionId: string;
  district?: string;
  eligibleVoters: number;
  actualVoters: number;
  percentage: number;
  snapshotAt: string;
}

// ── Primaries: Community Polls ───────────────────────────────────────────

export interface CommunityPoll {
  id: string;
  question: string;
  questionEn?: string;
  options: { id: string; text: string; textEn?: string; voteCount: number }[];
  totalVotes: number;
  isPinned: boolean;
  isActive: boolean;
  closesAt?: string;
  createdAt: string;
}

// ── Primaries: Campaign Events ───────────────────────────────────────────

export interface CampaignEvent {
  id: string;
  title: string;
  titleEn?: string;
  description?: string;
  imageUrl?: string;
  startDate: string;
  endDate?: string;
  location: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  candidateId?: string;
  candidate?: PrimaryCandidate;
  rsvpCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface EventRsvp {
  id: string;
  eventId: string;
  userId: string;
  status: 'interested' | 'going' | 'not_going';
  createdAt: string;
}

// ── Primaries: Gamification ──────────────────────────────────────────────

export interface UserPointEntry {
  id: string;
  userId: string;
  action: string;
  points: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeType: string;
  earnedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  totalPoints: number;
  rank: number;
}
