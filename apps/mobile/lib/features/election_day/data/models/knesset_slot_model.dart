import '../../domain/entities/knesset_slot.dart';

/// Data model for Knesset list slots, handles JSON serialization.
///
/// Maps WebSocket / API JSON payloads to the domain [KnessetSlot] entity.
class KnessetSlotModel {
  final int slotNumber;
  final String slotType;
  final String? candidateId;
  final String? candidateName;
  final bool isConfirmed;

  const KnessetSlotModel({
    required this.slotNumber,
    required this.slotType,
    this.candidateId,
    this.candidateName,
    this.isConfirmed = false,
  });

  factory KnessetSlotModel.fromJson(Map<String, dynamic> json) {
    return KnessetSlotModel(
      slotNumber: json['slotNumber'] != null
          ? int.tryParse(json['slotNumber'].toString()) ?? 0
          : 0,
      slotType: json['slotType'] as String? ?? 'national',
      candidateId: json['candidateId'] as String?,
      candidateName: json['candidateName'] as String?,
      isConfirmed: json['isConfirmed'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'slotNumber': slotNumber,
      'slotType': slotType,
      'candidateId': candidateId,
      'candidateName': candidateName,
      'isConfirmed': isConfirmed,
    };
  }

  static SlotType _parseSlotType(String type) {
    switch (type) {
      case 'leader':
        return SlotType.leader;
      case 'reserved_minority':
        return SlotType.reservedMinority;
      case 'reserved_woman':
        return SlotType.reservedWoman;
      case 'national':
        return SlotType.national;
      case 'district':
        return SlotType.district;
      default:
        return SlotType.national;
    }
  }

  KnessetSlot toEntity() {
    return KnessetSlot(
      slotNumber: slotNumber,
      slotType: _parseSlotType(slotType),
      candidateId: candidateId,
      candidateName: candidateName,
      isConfirmed: isConfirmed,
    );
  }
}
