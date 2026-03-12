import 'package:equatable/equatable.dart';

/// A single VIP benefit item.
class VipBenefit extends Equatable {
  final String id;
  final String titleKey;
  final String descriptionKey;
  final String icon;

  const VipBenefit({
    required this.id,
    required this.titleKey,
    required this.descriptionKey,
    required this.icon,
  });

  @override
  List<Object?> get props => [id, titleKey, descriptionKey, icon];
}
