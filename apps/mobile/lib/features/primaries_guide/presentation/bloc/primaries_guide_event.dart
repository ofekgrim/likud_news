import 'package:equatable/equatable.dart';

/// Base class for all PrimariesGuide BLoC events.
sealed class PrimariesGuideEvent extends Equatable {
  const PrimariesGuideEvent();

  @override
  List<Object?> get props => [];
}

/// Advances to the next screen.
final class NextScreen extends PrimariesGuideEvent {
  const NextScreen();
}

/// Goes back to the previous screen.
final class PreviousScreen extends PrimariesGuideEvent {
  const PreviousScreen();
}

/// Jumps to a specific screen by index.
final class GoToScreen extends PrimariesGuideEvent {
  final int index;

  const GoToScreen(this.index);

  @override
  List<Object?> get props => [index];
}
