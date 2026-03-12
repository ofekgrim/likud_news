import 'package:equatable/equatable.dart';

/// Types of Knesset list slots.
enum SlotType {
  leader,
  reservedMinority,
  reservedWoman,
  national,
  district,
}

/// Immutable entity representing a single slot in the Knesset list assembly.
///
/// Each slot has a number, type, and optionally a candidate assigned to it.
/// [isConfirmed] indicates whether the slot assignment has been finalized.
class KnessetSlot extends Equatable {
  final int slotNumber;
  final SlotType slotType;
  final String? candidateId;
  final String? candidateName;
  final bool isConfirmed;

  const KnessetSlot({
    required this.slotNumber,
    required this.slotType,
    this.candidateId,
    this.candidateName,
    this.isConfirmed = false,
  });

  /// Whether this slot has a candidate assigned.
  bool get isFilled => candidateId != null && candidateId!.isNotEmpty;

  /// Returns the candidate's initials (first letter of first and last name).
  String get initials {
    if (candidateName == null || candidateName!.isEmpty) return '';
    final parts = candidateName!.trim().split(RegExp(r'\s+'));
    if (parts.length == 1) return parts[0][0];
    return '${parts[0][0]}${parts.last[0]}';
  }

  KnessetSlot copyWith({
    int? slotNumber,
    SlotType? slotType,
    String? candidateId,
    String? candidateName,
    bool? isConfirmed,
  }) {
    return KnessetSlot(
      slotNumber: slotNumber ?? this.slotNumber,
      slotType: slotType ?? this.slotType,
      candidateId: candidateId ?? this.candidateId,
      candidateName: candidateName ?? this.candidateName,
      isConfirmed: isConfirmed ?? this.isConfirmed,
    );
  }

  @override
  List<Object?> get props => [
        slotNumber,
        slotType,
        candidateId,
        candidateName,
        isConfirmed,
      ];
}
