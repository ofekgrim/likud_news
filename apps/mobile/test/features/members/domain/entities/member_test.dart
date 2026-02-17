import 'package:flutter_test/flutter_test.dart';
import 'package:metzudat_halikud/features/members/domain/entities/member.dart';
import 'package:metzudat_halikud/features/members/domain/entities/member_detail.dart';

import '../../../../helpers/test_fixtures.dart';

void main() {
  group('Member', () {
    group('equality', () {
      test('two members with the same properties should be equal', () {
        final member1 = createTestMember();
        final member2 = createTestMember();

        expect(member1, equals(member2));
      });

      test('two members with different id should not be equal', () {
        final member1 = createTestMember(id: '1');
        final member2 = createTestMember(id: '2');

        expect(member1, isNot(equals(member2)));
      });

      test('two members with different name should not be equal', () {
        final member1 = createTestMember(name: 'Member A');
        final member2 = createTestMember(name: 'Member B');

        expect(member1, isNot(equals(member2)));
      });
    });

    group('props', () {
      test('props list should contain all fields', () {
        const member = Member(
          id: '3',
          name: 'Benjamin Netanyahu',
          nameEn: 'Benjamin Netanyahu EN',
          title: 'Prime Minister',
          bio: 'Leader of Likud',
          photoUrl: 'https://example.com/bibi.jpg',
          socialTwitter: '@netanyahu',
          socialFacebook: 'netanyahu',
          socialInstagram: 'netanyahu',
          isActive: true,
          sortOrder: 1,
        );

        expect(member.props, [
          '3',
          'Benjamin Netanyahu',
          'Benjamin Netanyahu EN',
          'Prime Minister',
          'Leader of Likud',
          'https://example.com/bibi.jpg',
          '@netanyahu',
          'netanyahu',
          'netanyahu',
          true,
          1,
        ]);
      });
    });

    group('default values', () {
      test('isActive should default to true', () {
        const member = Member(id: '1', name: 'Test');

        expect(member.isActive, isTrue);
      });

      test('sortOrder should default to 0', () {
        const member = Member(id: '1', name: 'Test');

        expect(member.sortOrder, equals(0));
      });

      test('nullable fields should default to null', () {
        const member = Member(id: '1', name: 'Test');

        expect(member.nameEn, isNull);
        expect(member.title, isNull);
        expect(member.bio, isNull);
        expect(member.photoUrl, isNull);
        expect(member.socialTwitter, isNull);
        expect(member.socialFacebook, isNull);
        expect(member.socialInstagram, isNull);
      });
    });
  });

  group('MemberDetail', () {
    group('equality', () {
      test('two member details with the same properties should be equal', () {
        final detail1 = createTestMemberDetail();
        final detail2 = createTestMemberDetail();

        expect(detail1, equals(detail2));
      });

      test('two member details with different member should not be equal', () {
        final detail1 = createTestMemberDetail(
          member: createTestMember(id: '1'),
        );
        final detail2 = createTestMemberDetail(
          member: createTestMember(id: '2'),
        );

        expect(detail1, isNot(equals(detail2)));
      });
    });

    group('props', () {
      test('props list should contain all fields', () {
        final member = createTestMember();
        final articles = createTestArticleList(2);
        final detail = MemberDetail(
          member: member,
          articles: articles,
        );

        expect(detail.props, [
          member,
          articles,
        ]);
      });
    });

    group('default values', () {
      test('articles should default to empty list', () {
        final detail = MemberDetail(member: createTestMember());

        expect(detail.articles, isEmpty);
        expect(detail.articles, isA<List>());
      });
    });
  });
}
