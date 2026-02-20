import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/article_detail/data/models/content_block_model.dart';
import 'package:metzudat_halikud/features/article_detail/domain/entities/content_block.dart';

void main() {
  group('ContentBlockModel.fromJsonList', () {
    test('returns empty list for null input', () {
      final result = ContentBlockModel.fromJsonList(null);
      expect(result, isEmpty);
    });

    test('returns empty list for empty list input', () {
      final result = ContentBlockModel.fromJsonList([]);
      expect(result, isEmpty);
    });

    group('ParagraphBlock', () {
      test('parses correctly with all fields', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'paragraph',
            'id': 'p1',
            'text': 'Hello world',
          },
        ]);

        expect(result, hasLength(1));
        expect(result[0], isA<ParagraphBlock>());
        final block = result[0] as ParagraphBlock;
        expect(block.id, 'p1');
        expect(block.type, 'paragraph');
        expect(block.text, 'Hello world');
      });

      test('defaults text to empty string when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'paragraph', 'id': 'p2'},
        ]);

        expect(result, hasLength(1));
        final block = result[0] as ParagraphBlock;
        expect(block.text, '');
      });

      test('defaults id to empty string when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'paragraph', 'text': 'No id here'},
        ]);

        expect(result, hasLength(1));
        final block = result[0] as ParagraphBlock;
        expect(block.id, '');
        expect(block.text, 'No id here');
      });
    });

    group('HeadingBlock', () {
      test('parses correctly with all fields', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'heading',
            'id': 'h1',
            'text': 'Section Title',
            'level': 3,
          },
        ]);

        expect(result, hasLength(1));
        expect(result[0], isA<HeadingBlock>());
        final block = result[0] as HeadingBlock;
        expect(block.id, 'h1');
        expect(block.type, 'heading');
        expect(block.text, 'Section Title');
        expect(block.level, 3);
      });

      test('defaults level to 2 when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'heading',
            'id': 'h2',
            'text': 'Default level heading',
          },
        ]);

        final block = result[0] as HeadingBlock;
        expect(block.level, 2);
      });

      test('defaults text to empty string when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'heading', 'id': 'h3', 'level': 4},
        ]);

        final block = result[0] as HeadingBlock;
        expect(block.text, '');
        expect(block.level, 4);
      });
    });

    group('ImageBlock', () {
      test('parses correctly with all fields', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'image',
            'id': 'img1',
            'url': 'https://cdn.example.com/thumb.jpg',
            'fullUrl': 'https://cdn.example.com/full.jpg',
            'credit': 'Reuters',
            'captionHe': 'תיאור בעברית',
            'captionEn': 'English caption',
            'altText': 'A descriptive alt text',
          },
        ]);

        expect(result, hasLength(1));
        expect(result[0], isA<ImageBlock>());
        final block = result[0] as ImageBlock;
        expect(block.id, 'img1');
        expect(block.type, 'image');
        expect(block.url, 'https://cdn.example.com/thumb.jpg');
        expect(block.fullUrl, 'https://cdn.example.com/full.jpg');
        expect(block.credit, 'Reuters');
        expect(block.captionHe, 'תיאור בעברית');
        expect(block.captionEn, 'English caption');
        expect(block.altText, 'A descriptive alt text');
      });

      test('defaults optional fields to null when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'image',
            'id': 'img2',
            'url': 'https://cdn.example.com/photo.jpg',
          },
        ]);

        final block = result[0] as ImageBlock;
        expect(block.url, 'https://cdn.example.com/photo.jpg');
        expect(block.fullUrl, isNull);
        expect(block.credit, isNull);
        expect(block.captionHe, isNull);
        expect(block.captionEn, isNull);
        expect(block.altText, isNull);
      });

      test('defaults url to empty string when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'image', 'id': 'img3'},
        ]);

        final block = result[0] as ImageBlock;
        expect(block.url, '');
      });
    });

    group('YouTubeEmbedBlock', () {
      test('parses correctly with all fields', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'youtube',
            'id': 'yt1',
            'videoId': 'dQw4w9WgXcQ',
            'caption': 'Watch this video',
            'credit': 'YouTube Channel',
          },
        ]);

        expect(result, hasLength(1));
        expect(result[0], isA<YouTubeEmbedBlock>());
        final block = result[0] as YouTubeEmbedBlock;
        expect(block.id, 'yt1');
        expect(block.type, 'youtube');
        expect(block.videoId, 'dQw4w9WgXcQ');
        expect(block.caption, 'Watch this video');
        expect(block.credit, 'YouTube Channel');
      });

      test('defaults optional fields to null when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'youtube',
            'id': 'yt2',
            'videoId': 'abc123',
          },
        ]);

        final block = result[0] as YouTubeEmbedBlock;
        expect(block.videoId, 'abc123');
        expect(block.caption, isNull);
        expect(block.credit, isNull);
      });

      test('defaults videoId to empty string when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'youtube', 'id': 'yt3'},
        ]);

        final block = result[0] as YouTubeEmbedBlock;
        expect(block.videoId, '');
      });
    });

    group('TweetEmbedBlock', () {
      test('parses correctly with all fields', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'tweet',
            'id': 'tw1',
            'tweetId': '1234567890',
            'authorHandle': '@likud_party',
            'previewText': 'This is a tweet preview',
            'caption': 'Tweet caption',
          },
        ]);

        expect(result, hasLength(1));
        expect(result[0], isA<TweetEmbedBlock>());
        final block = result[0] as TweetEmbedBlock;
        expect(block.id, 'tw1');
        expect(block.type, 'tweet');
        expect(block.tweetId, '1234567890');
        expect(block.authorHandle, '@likud_party');
        expect(block.previewText, 'This is a tweet preview');
        expect(block.caption, 'Tweet caption');
      });

      test('defaults optional fields to null when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'tweet',
            'id': 'tw2',
            'tweetId': '9876543210',
          },
        ]);

        final block = result[0] as TweetEmbedBlock;
        expect(block.tweetId, '9876543210');
        expect(block.authorHandle, isNull);
        expect(block.previewText, isNull);
        expect(block.caption, isNull);
      });

      test('defaults tweetId to empty string when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'tweet', 'id': 'tw3'},
        ]);

        final block = result[0] as TweetEmbedBlock;
        expect(block.tweetId, '');
      });
    });

    group('QuoteBlock', () {
      test('parses correctly with all fields', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'quote',
            'id': 'q1',
            'text': 'To be or not to be',
            'attribution': 'Shakespeare',
          },
        ]);

        expect(result, hasLength(1));
        expect(result[0], isA<QuoteBlock>());
        final block = result[0] as QuoteBlock;
        expect(block.id, 'q1');
        expect(block.type, 'quote');
        expect(block.text, 'To be or not to be');
        expect(block.attribution, 'Shakespeare');
      });

      test('defaults attribution to null when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'quote',
            'id': 'q2',
            'text': 'Anonymous quote',
          },
        ]);

        final block = result[0] as QuoteBlock;
        expect(block.text, 'Anonymous quote');
        expect(block.attribution, isNull);
      });

      test('defaults text to empty string when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'quote', 'id': 'q3'},
        ]);

        final block = result[0] as QuoteBlock;
        expect(block.text, '');
      });
    });

    group('DividerBlock', () {
      test('parses correctly', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'divider',
            'id': 'd1',
          },
        ]);

        expect(result, hasLength(1));
        expect(result[0], isA<DividerBlock>());
        final block = result[0] as DividerBlock;
        expect(block.id, 'd1');
        expect(block.type, 'divider');
      });

      test('defaults id to empty string when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'divider'},
        ]);

        final block = result[0] as DividerBlock;
        expect(block.id, '');
      });
    });

    group('BulletListBlock', () {
      test('parses correctly with all fields', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'bullet_list',
            'id': 'bl1',
            'items': ['First item', 'Second item', 'Third item'],
          },
        ]);

        expect(result, hasLength(1));
        expect(result[0], isA<BulletListBlock>());
        final block = result[0] as BulletListBlock;
        expect(block.id, 'bl1');
        expect(block.type, 'bullet_list');
        expect(block.items, ['First item', 'Second item', 'Third item']);
      });

      test('defaults items to empty list when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'bullet_list', 'id': 'bl2'},
        ]);

        final block = result[0] as BulletListBlock;
        expect(block.items, isEmpty);
      });

      test('defaults items to empty list when null', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'bullet_list', 'id': 'bl3', 'items': null},
        ]);

        final block = result[0] as BulletListBlock;
        expect(block.items, isEmpty);
      });
    });

    group('ArticleLinkBlock', () {
      test('parses correctly with all fields including linkedArticle', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'article_link',
            'id': 'al1',
            'linkedArticleId': 'article-uuid-123',
            'displayStyle': 'inline',
            'linkedArticle': {
              'title': 'Related Article Title',
              'heroImageUrl': 'https://cdn.example.com/hero.jpg',
              'slug': 'related-article-slug',
            },
          },
        ]);

        expect(result, hasLength(1));
        expect(result[0], isA<ArticleLinkBlock>());
        final block = result[0] as ArticleLinkBlock;
        expect(block.id, 'al1');
        expect(block.type, 'article_link');
        expect(block.linkedArticleId, 'article-uuid-123');
        expect(block.displayStyle, 'inline');
        expect(block.linkedArticleTitle, 'Related Article Title');
        expect(block.linkedArticleImageUrl, 'https://cdn.example.com/hero.jpg');
        expect(block.linkedArticleSlug, 'related-article-slug');
      });

      test('defaults displayStyle to card when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'article_link',
            'id': 'al2',
            'linkedArticleId': 'article-uuid-456',
          },
        ]);

        final block = result[0] as ArticleLinkBlock;
        expect(block.displayStyle, 'card');
      });

      test('defaults linkedArticleId to empty string when missing', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'article_link', 'id': 'al3'},
        ]);

        final block = result[0] as ArticleLinkBlock;
        expect(block.linkedArticleId, '');
      });

      test('defaults linked article fields to null when linkedArticle is absent', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'article_link',
            'id': 'al4',
            'linkedArticleId': 'article-uuid-789',
          },
        ]);

        final block = result[0] as ArticleLinkBlock;
        expect(block.linkedArticleTitle, isNull);
        expect(block.linkedArticleImageUrl, isNull);
        expect(block.linkedArticleSlug, isNull);
      });

      test('handles linkedArticle with partial fields', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'article_link',
            'id': 'al5',
            'linkedArticleId': 'article-uuid-000',
            'linkedArticle': {
              'title': 'Only Title',
            },
          },
        ]);

        final block = result[0] as ArticleLinkBlock;
        expect(block.linkedArticleTitle, 'Only Title');
        expect(block.linkedArticleImageUrl, isNull);
        expect(block.linkedArticleSlug, isNull);
      });
    });

    group('unknown block types', () {
      test('silently skips unknown type', () {
        final result = ContentBlockModel.fromJsonList([
          {
            'type': 'unknown_widget',
            'id': 'u1',
            'data': 'some data',
          },
        ]);

        expect(result, isEmpty);
      });

      test('silently skips block with null type', () {
        final result = ContentBlockModel.fromJsonList([
          {'id': 'no-type'},
        ]);

        expect(result, isEmpty);
      });

      test('skips unknown types while keeping valid ones', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'paragraph', 'id': 'p1', 'text': 'Valid'},
          {'type': 'nonexistent', 'id': 'x1'},
          {'type': 'divider', 'id': 'd1'},
        ]);

        expect(result, hasLength(2));
        expect(result[0], isA<ParagraphBlock>());
        expect(result[1], isA<DividerBlock>());
      });
    });

    group('mixed block types', () {
      test('parses a realistic article body with multiple block types', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'heading', 'id': 'h1', 'text': 'כותרת ראשית', 'level': 2},
          {'type': 'paragraph', 'id': 'p1', 'text': 'פסקה ראשונה של הכתבה.'},
          {
            'type': 'image',
            'id': 'img1',
            'url': 'https://cdn.example.com/photo1.jpg',
            'credit': 'צילום: ישראל היום',
            'captionHe': 'תמונה מהאירוע',
          },
          {'type': 'paragraph', 'id': 'p2', 'text': 'פסקה שנייה עם פרטים נוספים.'},
          {
            'type': 'quote',
            'id': 'q1',
            'text': 'ציטוט חשוב מראש הממשלה',
            'attribution': 'בנימין נתניהו',
          },
          {'type': 'divider', 'id': 'd1'},
          {
            'type': 'youtube',
            'id': 'yt1',
            'videoId': 'abc123xyz',
            'caption': 'סרטון מהמליאה',
          },
          {
            'type': 'bullet_list',
            'id': 'bl1',
            'items': ['נקודה ראשונה', 'נקודה שנייה', 'נקודה שלישית'],
          },
          {
            'type': 'tweet',
            'id': 'tw1',
            'tweetId': '1500000000000',
            'authorHandle': '@IsraelMFA',
          },
          {
            'type': 'article_link',
            'id': 'al1',
            'linkedArticleId': 'related-uuid',
            'displayStyle': 'card',
            'linkedArticle': {
              'title': 'כתבה קשורה',
              'heroImageUrl': 'https://cdn.example.com/related.jpg',
              'slug': 'related-article',
            },
          },
        ]);

        expect(result, hasLength(10));
        expect(result[0], isA<HeadingBlock>());
        expect(result[1], isA<ParagraphBlock>());
        expect(result[2], isA<ImageBlock>());
        expect(result[3], isA<ParagraphBlock>());
        expect(result[4], isA<QuoteBlock>());
        expect(result[5], isA<DividerBlock>());
        expect(result[6], isA<YouTubeEmbedBlock>());
        expect(result[7], isA<BulletListBlock>());
        expect(result[8], isA<TweetEmbedBlock>());
        expect(result[9], isA<ArticleLinkBlock>());

        // Verify specific field values for spot checks
        final heading = result[0] as HeadingBlock;
        expect(heading.text, 'כותרת ראשית');
        expect(heading.level, 2);

        final image = result[2] as ImageBlock;
        expect(image.credit, 'צילום: ישראל היום');

        final quote = result[4] as QuoteBlock;
        expect(quote.attribution, 'בנימין נתניהו');

        final bulletList = result[7] as BulletListBlock;
        expect(bulletList.items, hasLength(3));

        final articleLink = result[9] as ArticleLinkBlock;
        expect(articleLink.linkedArticleTitle, 'כתבה קשורה');
        expect(articleLink.linkedArticleSlug, 'related-article');
      });

      test('handles mixed valid and unknown types preserving order', () {
        final result = ContentBlockModel.fromJsonList([
          {'type': 'paragraph', 'id': 'p1', 'text': 'First'},
          {'type': 'carousel', 'id': 'c1'},
          {'type': 'heading', 'id': 'h1', 'text': 'Second', 'level': 3},
          {'type': 'audio_player', 'id': 'ap1'},
          {'type': 'divider', 'id': 'd1'},
        ]);

        expect(result, hasLength(3));
        expect(result[0], isA<ParagraphBlock>());
        expect((result[0] as ParagraphBlock).text, 'First');
        expect(result[1], isA<HeadingBlock>());
        expect((result[1] as HeadingBlock).text, 'Second');
        expect(result[2], isA<DividerBlock>());
      });
    });
  });
}
