import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/video/domain/entities/video_article.dart';

import '../../../../helpers/test_fixtures.dart';

void main() {
  group('VideoArticle', () {
    group('equality', () {
      test('two video articles with the same properties should be equal', () {
        final video1 = createTestVideoArticle();
        final video2 = createTestVideoArticle();

        expect(video1, equals(video2));
      });

      test('two video articles with different id should not be equal', () {
        final video1 = createTestVideoArticle(id: '1');
        final video2 = createTestVideoArticle(id: '2');

        expect(video1, isNot(equals(video2)));
      });

      test('two video articles with different title should not be equal', () {
        final video1 = createTestVideoArticle(title: 'Video A');
        final video2 = createTestVideoArticle(title: 'Video B');

        expect(video1, isNot(equals(video2)));
      });

      test('two video articles with different duration should not be equal',
          () {
        final video1 = createTestVideoArticle(duration: 60);
        final video2 = createTestVideoArticle(duration: 300);

        expect(video1, isNot(equals(video2)));
      });
    });

    group('props', () {
      test('props list should contain all fields', () {
        final publishedAt = DateTime(2024, 1, 15, 10, 30);
        final video = VideoArticle(
          id: '5',
          title: 'Likud Conference',
          subtitle: 'Annual conference recap',
          heroImageUrl: 'https://example.com/thumb.jpg',
          videoUrl: 'https://example.com/video.mp4',
          duration: 180,
          categoryName: 'Events',
          categoryColor: '#0099DB',
          slug: 'likud-conference',
          publishedAt: publishedAt,
        );

        expect(video.props, [
          '5',
          'Likud Conference',
          'Annual conference recap',
          'https://example.com/thumb.jpg',
          'https://example.com/video.mp4',
          180,
          'Events',
          '#0099DB',
          'likud-conference',
          publishedAt,
        ]);
      });
    });

    group('default values', () {
      test('duration should default to 0', () {
        const video = VideoArticle(id: '1', title: 'Test');

        expect(video.duration, equals(0));
      });

      test('nullable fields should default to null', () {
        const video = VideoArticle(id: '1', title: 'Test');

        expect(video.subtitle, isNull);
        expect(video.heroImageUrl, isNull);
        expect(video.videoUrl, isNull);
        expect(video.categoryName, isNull);
        expect(video.categoryColor, isNull);
        expect(video.slug, isNull);
        expect(video.publishedAt, isNull);
      });
    });
  });
}
