import 'package:equatable/equatable.dart';

import '../../../home/domain/entities/article.dart';
import 'member.dart';

/// Extended member entity that includes related articles.
///
/// Used on the member detail screen to show the full profile
/// along with articles associated with this member.
class MemberDetail extends Equatable {
  final Member member;
  final List<Article> articles;

  const MemberDetail({
    required this.member,
    this.articles = const [],
  });

  @override
  List<Object?> get props => [member, articles];
}
