import 'package:equatable/equatable.dart';

/// Immutable station report entity representing a user-submitted wait-time report.
class StationReport extends Equatable {
  final String id;
  final String stationId;
  final String? userId;
  final int waitMinutes;
  final String? crowdLevel;
  final String? note;
  final DateTime createdAt;

  const StationReport({
    required this.id,
    required this.stationId,
    this.userId,
    required this.waitMinutes,
    this.crowdLevel,
    this.note,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        stationId,
        userId,
        waitMinutes,
        crowdLevel,
        note,
        createdAt,
      ];
}
