import 'package:equatable/equatable.dart';

import '../../domain/entities/guide_screen.dart';

/// Base class for all PrimariesGuide BLoC states.
sealed class PrimariesGuideState extends Equatable {
  const PrimariesGuideState();

  @override
  List<Object?> get props => [];
}

/// The guide screens are loaded and ready.
final class PrimariesGuideLoaded extends PrimariesGuideState {
  final int currentIndex;
  final List<GuideScreen> screens;
  final bool isLastScreen;

  const PrimariesGuideLoaded({
    required this.currentIndex,
    required this.screens,
    required this.isLastScreen,
  });

  @override
  List<Object?> get props => [currentIndex, screens, isLastScreen];

  PrimariesGuideLoaded copyWith({
    int? currentIndex,
    List<GuideScreen>? screens,
    bool? isLastScreen,
  }) {
    return PrimariesGuideLoaded(
      currentIndex: currentIndex ?? this.currentIndex,
      screens: screens ?? this.screens,
      isLastScreen: isLastScreen ?? this.isLastScreen,
    );
  }
}
