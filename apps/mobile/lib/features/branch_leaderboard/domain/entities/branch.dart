import 'package:equatable/equatable.dart';

/// Immutable entity representing a Likud branch.
class Branch extends Equatable {
  final String id;
  final String name;
  final String district;
  final int memberCount;
  final bool isActive;

  const Branch({
    required this.id,
    required this.name,
    required this.district,
    required this.memberCount,
    this.isActive = true,
  });

  @override
  List<Object?> get props => [id, name, district, memberCount, isActive];
}
