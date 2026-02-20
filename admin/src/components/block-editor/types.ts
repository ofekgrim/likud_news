import type { ContentBlock } from '@/lib/types';

export function generateBlockId(): string {
  return crypto.randomUUID();
}

export function createEmptyParagraph(): ContentBlock {
  return { id: generateBlockId(), type: 'paragraph', text: '' };
}

export function createEmptyHeading(level: 2 | 3 | 4 = 2): ContentBlock {
  return { id: generateBlockId(), type: 'heading', text: '', level };
}

export function createEmptyImage(): ContentBlock {
  return {
    id: generateBlockId(),
    type: 'image',
    url: '',
    credit: '',
    captionHe: '',
    altText: '',
  };
}

export function createEmptyQuote(): ContentBlock {
  return { id: generateBlockId(), type: 'quote', text: '', attribution: '' };
}

export function createDivider(): ContentBlock {
  return { id: generateBlockId(), type: 'divider' };
}

export function createEmptyBulletList(): ContentBlock {
  return { id: generateBlockId(), type: 'bullet_list', items: [''] };
}

export function createEmptyYouTube(): ContentBlock {
  return { id: generateBlockId(), type: 'youtube', videoId: '', caption: '' };
}

export function createEmptyTweet(): ContentBlock {
  return { id: generateBlockId(), type: 'tweet', tweetId: '', authorHandle: '' };
}

export function createEmptyArticleLink(): ContentBlock {
  return {
    id: generateBlockId(),
    type: 'article_link',
    linkedArticleId: '',
    displayStyle: 'card',
  };
}

export function createEmptyVideo(): ContentBlock {
  return {
    id: generateBlockId(),
    type: 'video',
    source: 'youtube',
    videoId: '',
    url: '',
    caption: '',
    credit: '',
  } as ContentBlock;
}
