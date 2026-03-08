import 'package:equatable/equatable.dart';

class UserStreak extends Equatable {
  final int currentStreak;
  final int longestStreak;
  final DateTime? lastActivityDate;

  const UserStreak({
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.lastActivityDate,
  });

  @override
  List<Object?> get props => [currentStreak, longestStreak, lastActivityDate];
}
