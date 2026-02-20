import 'package:equatable/equatable.dart';

/// A tag entity used to classify articles by topic, person, or location.
class Tag extends Equatable {
  final String id;
  final String nameHe;
  final String? nameEn;
  final String slug;
  final String tagType;

  const Tag({
    required this.id,
    required this.nameHe,
    this.nameEn,
    required this.slug,
    this.tagType = 'topic',
  });

  @override
  List<Object?> get props => [id, nameHe, nameEn, slug, tagType];
}
