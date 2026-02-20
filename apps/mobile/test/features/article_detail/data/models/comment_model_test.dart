import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/article_detail/data/models/comment_model.dart';
import 'package:metzudat_halikud/features/article_detail/domain/entities/comment.dart';

void main() {
  group('CommentModel', () {
    final fixedDate = DateTime(2024, 6, 15, 12, 30);
    final fixedDateString = '2024-06-15T12:30:00.000';

    Map<String, dynamic> createFullJson({
      String id = 'comment-1',
      String articleId = 'article-1',
      String? parentId,
      String authorName = 'Test Author',
      String body = 'This is a test comment.',
      bool isPinned = true,
      int likesCount = 5,
      String? createdAt,
      List<Map<String, dynamic>>? replies,
    }) {
      return {
        'id': id,
        'articleId': articleId,
        if (parentId != null) 'parentId': parentId,
        'authorName': authorName,
        'body': body,
        'isPinned': isPinned,
        'likesCount': likesCount,
        'createdAt': createdAt ?? fixedDateString,
        if (replies != null) 'replies': replies,
      };
    }

    group('fromJson', () {
      test('parses all fields correctly', () {
        final json = createFullJson(
          id: 'c-100',
          articleId: 'a-200',
          parentId: 'c-50',
          authorName: 'Jane Doe',
          body: 'Great article!',
          isPinned: true,
          likesCount: 42,
          createdAt: fixedDateString,
        );

        final model = CommentModel.fromJson(json);

        expect(model.id, equals('c-100'));
        expect(model.articleId, equals('a-200'));
        expect(model.parentId, equals('c-50'));
        expect(model.authorName, equals('Jane Doe'));
        expect(model.body, equals('Great article!'));
        expect(model.isPinned, isTrue);
        expect(model.likesCount, equals(42));
        expect(model.createdAt, equals(fixedDate));
        expect(model.replies, isEmpty);
      });

      test('handles missing optional fields with defaults', () {
        final json = <String, dynamic>{};

        final model = CommentModel.fromJson(json);

        expect(model.id, equals(''));
        expect(model.articleId, equals(''));
        expect(model.parentId, isNull);
        expect(model.authorName, equals(''));
        expect(model.body, equals(''));
        expect(model.isPinned, isFalse);
        expect(model.likesCount, equals(0));
        expect(model.createdAt, isA<DateTime>());
        expect(model.replies, isEmpty);
      });

      test('handles null values for nullable fields', () {
        final json = <String, dynamic>{
          'id': null,
          'articleId': null,
          'parentId': null,
          'authorName': null,
          'body': null,
          'isPinned': null,
          'likesCount': null,
          'createdAt': null,
          'replies': null,
        };

        final model = CommentModel.fromJson(json);

        expect(model.id, equals(''));
        expect(model.articleId, equals(''));
        expect(model.parentId, isNull);
        expect(model.authorName, equals(''));
        expect(model.body, equals(''));
        expect(model.isPinned, isFalse);
        expect(model.likesCount, equals(0));
        expect(model.createdAt, isA<DateTime>());
        expect(model.replies, isEmpty);
      });

      test('parses nested replies recursively', () {
        final json = createFullJson(
          id: 'parent-1',
          replies: [
            createFullJson(
              id: 'reply-1',
              parentId: 'parent-1',
              body: 'First reply',
              replies: [
                createFullJson(
                  id: 'reply-1-1',
                  parentId: 'reply-1',
                  body: 'Nested reply',
                ),
              ],
            ),
            createFullJson(
              id: 'reply-2',
              parentId: 'parent-1',
              body: 'Second reply',
            ),
          ],
        );

        final model = CommentModel.fromJson(json);

        expect(model.id, equals('parent-1'));
        expect(model.replies, hasLength(2));

        final firstReply = model.replies[0];
        expect(firstReply.id, equals('reply-1'));
        expect(firstReply.parentId, equals('parent-1'));
        expect(firstReply.body, equals('First reply'));
        expect(firstReply.replies, hasLength(1));

        final nestedReply = firstReply.replies[0];
        expect(nestedReply.id, equals('reply-1-1'));
        expect(nestedReply.parentId, equals('reply-1'));
        expect(nestedReply.body, equals('Nested reply'));
        expect(nestedReply.replies, isEmpty);

        final secondReply = model.replies[1];
        expect(secondReply.id, equals('reply-2'));
        expect(secondReply.parentId, equals('parent-1'));
        expect(secondReply.body, equals('Second reply'));
        expect(secondReply.replies, isEmpty);
      });
    });

    group('toEntity', () {
      test('converts to Comment correctly', () {
        final model = CommentModel(
          id: 'c-1',
          articleId: 'a-1',
          parentId: 'c-0',
          authorName: 'John',
          body: 'Hello world',
          isPinned: true,
          likesCount: 10,
          createdAt: fixedDate,
        );

        final entity = model.toEntity();

        expect(entity, isA<Comment>());
        expect(entity.id, equals('c-1'));
        expect(entity.articleId, equals('a-1'));
        expect(entity.parentId, equals('c-0'));
        expect(entity.authorName, equals('John'));
        expect(entity.body, equals('Hello world'));
        expect(entity.isPinned, isTrue);
        expect(entity.likesCount, equals(10));
        expect(entity.createdAt, equals(fixedDate));
        expect(entity.replies, isEmpty);
      });

      test('converts with null parentId', () {
        final model = CommentModel(
          id: 'c-1',
          articleId: 'a-1',
          authorName: 'Jane',
          body: 'Top-level comment',
          createdAt: fixedDate,
        );

        final entity = model.toEntity();

        expect(entity.parentId, isNull);
      });

      test('preserves nested replies', () {
        final model = CommentModel(
          id: 'parent',
          articleId: 'a-1',
          authorName: 'Author',
          body: 'Parent comment',
          createdAt: fixedDate,
          replies: [
            CommentModel(
              id: 'child-1',
              articleId: 'a-1',
              parentId: 'parent',
              authorName: 'Replier 1',
              body: 'First reply',
              isPinned: false,
              likesCount: 3,
              createdAt: fixedDate,
              replies: [
                CommentModel(
                  id: 'grandchild-1',
                  articleId: 'a-1',
                  parentId: 'child-1',
                  authorName: 'Replier 2',
                  body: 'Nested reply',
                  createdAt: fixedDate,
                ),
              ],
            ),
          ],
        );

        final entity = model.toEntity();

        expect(entity.replies, hasLength(1));

        final childEntity = entity.replies[0];
        expect(childEntity, isA<Comment>());
        expect(childEntity.id, equals('child-1'));
        expect(childEntity.parentId, equals('parent'));
        expect(childEntity.authorName, equals('Replier 1'));
        expect(childEntity.body, equals('First reply'));
        expect(childEntity.likesCount, equals(3));
        expect(childEntity.replies, hasLength(1));

        final grandchildEntity = childEntity.replies[0];
        expect(grandchildEntity, isA<Comment>());
        expect(grandchildEntity.id, equals('grandchild-1'));
        expect(grandchildEntity.parentId, equals('child-1'));
        expect(grandchildEntity.authorName, equals('Replier 2'));
        expect(grandchildEntity.body, equals('Nested reply'));
        expect(grandchildEntity.replies, isEmpty);
      });
    });

    group('fromJsonList', () {
      test('returns empty list for null input', () {
        final result = CommentModel.fromJsonList(null);

        expect(result, isEmpty);
        expect(result, isA<List<Comment>>());
      });

      test('returns empty list for empty list input', () {
        final result = CommentModel.fromJsonList([]);

        expect(result, isEmpty);
        expect(result, isA<List<Comment>>());
      });

      test('parses multiple comments', () {
        final jsonList = [
          createFullJson(
            id: 'c-1',
            authorName: 'Alice',
            body: 'First comment',
          ),
          createFullJson(
            id: 'c-2',
            authorName: 'Bob',
            body: 'Second comment',
            isPinned: false,
            likesCount: 0,
          ),
          createFullJson(
            id: 'c-3',
            authorName: 'Charlie',
            body: 'Third comment',
            likesCount: 99,
          ),
        ];

        final result = CommentModel.fromJsonList(jsonList);

        expect(result, hasLength(3));

        expect(result[0].id, equals('c-1'));
        expect(result[0].authorName, equals('Alice'));
        expect(result[0].body, equals('First comment'));

        expect(result[1].id, equals('c-2'));
        expect(result[1].authorName, equals('Bob'));
        expect(result[1].body, equals('Second comment'));

        expect(result[2].id, equals('c-3'));
        expect(result[2].authorName, equals('Charlie'));
        expect(result[2].body, equals('Third comment'));
        expect(result[2].likesCount, equals(99));
      });
    });
  });
}
