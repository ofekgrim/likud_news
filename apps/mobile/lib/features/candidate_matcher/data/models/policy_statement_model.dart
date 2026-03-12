import '../../domain/entities/policy_statement.dart';

/// Data model for policy statements. Handles JSON serialization
/// and mapping to the domain [PolicyStatement] entity.
class PolicyStatementModel {
  final String id;
  final String textHe;
  final String? textEn;
  final String category;
  final double defaultWeight;
  final int sortOrder;

  const PolicyStatementModel({
    required this.id,
    required this.textHe,
    this.textEn,
    required this.category,
    this.defaultWeight = 1.0,
    this.sortOrder = 0,
  });

  factory PolicyStatementModel.fromJson(Map<String, dynamic> json) {
    return PolicyStatementModel(
      id: json['id'] as String,
      textHe: json['textHe'] as String,
      textEn: json['textEn'] as String?,
      category: json['category'] as String,
      defaultWeight:
          double.tryParse(json['defaultWeight']?.toString() ?? '1.0') ?? 1.0,
      sortOrder: json['sortOrder'] as int? ?? 0,
    );
  }

  PolicyStatement toEntity() {
    return PolicyStatement(
      id: id,
      textHe: textHe,
      textEn: textEn,
      category: _parseCategory(category),
      defaultWeight: defaultWeight,
      sortOrder: sortOrder,
    );
  }

  static PolicyCategory _parseCategory(String value) {
    switch (value) {
      case 'security':
        return PolicyCategory.security;
      case 'economy':
        return PolicyCategory.economy;
      case 'judiciary':
        return PolicyCategory.judiciary;
      case 'housing':
        return PolicyCategory.housing;
      case 'social':
        return PolicyCategory.social;
      case 'foreign':
        return PolicyCategory.foreign;
      default:
        return PolicyCategory.social;
    }
  }
}
