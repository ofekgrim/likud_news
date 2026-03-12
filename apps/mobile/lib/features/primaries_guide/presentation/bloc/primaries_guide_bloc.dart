import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../domain/entities/guide_screen.dart';
import 'primaries_guide_event.dart';
import 'primaries_guide_state.dart';

/// Manages the state of the Primaries Guide screens.
///
/// Initializes with 6 guide screens and handles navigation between them.
@injectable
class PrimariesGuideBloc
    extends Bloc<PrimariesGuideEvent, PrimariesGuideState> {
  PrimariesGuideBloc() : super(_initialState()) {
    on<NextScreen>(_onNextScreen);
    on<PreviousScreen>(_onPreviousScreen);
    on<GoToScreen>(_onGoToScreen);
  }

  static PrimariesGuideLoaded _initialState() {
    final screens = _buildScreens();
    return PrimariesGuideLoaded(
      currentIndex: 0,
      screens: screens,
      isLastScreen: screens.length == 1,
    );
  }

  static List<GuideScreen> _buildScreens() {
    return const [
      GuideScreen(
        index: 0,
        titleKey: 'primaries_guide.screen1_title',
        descriptionKey: 'primaries_guide.screen1_desc',
        icon: Icons.how_to_vote_outlined,
        backgroundColor: Color(0xFFE3F2FD),
      ),
      GuideScreen(
        index: 1,
        titleKey: 'primaries_guide.screen2_title',
        descriptionKey: 'primaries_guide.screen2_desc',
        icon: Icons.star_outline,
        backgroundColor: Color(0xFFFFF3E0),
      ),
      GuideScreen(
        index: 2,
        titleKey: 'primaries_guide.screen3_title',
        descriptionKey: 'primaries_guide.screen3_desc',
        icon: Icons.shield_outlined,
        backgroundColor: Color(0xFFE8F5E9),
      ),
      GuideScreen(
        index: 3,
        titleKey: 'primaries_guide.screen4_title',
        descriptionKey: 'primaries_guide.screen4_desc',
        icon: Icons.format_list_numbered,
        backgroundColor: Color(0xFFE1F5FE),
      ),
      GuideScreen(
        index: 4,
        titleKey: 'primaries_guide.screen5_title',
        descriptionKey: 'primaries_guide.screen5_desc',
        icon: Icons.map_outlined,
        backgroundColor: Color(0xFFFCE4EC),
      ),
      GuideScreen(
        index: 5,
        titleKey: 'primaries_guide.screen6_title',
        descriptionKey: 'primaries_guide.screen6_desc',
        icon: Icons.checklist,
        backgroundColor: Color(0xFFF3E5F5),
      ),
    ];
  }

  void _onNextScreen(
    NextScreen event,
    Emitter<PrimariesGuideState> emit,
  ) {
    final currentState = state;
    if (currentState is PrimariesGuideLoaded) {
      final nextIndex = currentState.currentIndex + 1;
      if (nextIndex < currentState.screens.length) {
        emit(currentState.copyWith(
          currentIndex: nextIndex,
          isLastScreen: nextIndex == currentState.screens.length - 1,
        ));
      }
    }
  }

  void _onPreviousScreen(
    PreviousScreen event,
    Emitter<PrimariesGuideState> emit,
  ) {
    final currentState = state;
    if (currentState is PrimariesGuideLoaded) {
      final prevIndex = currentState.currentIndex - 1;
      if (prevIndex >= 0) {
        emit(currentState.copyWith(
          currentIndex: prevIndex,
          isLastScreen: false,
        ));
      }
    }
  }

  void _onGoToScreen(
    GoToScreen event,
    Emitter<PrimariesGuideState> emit,
  ) {
    final currentState = state;
    if (currentState is PrimariesGuideLoaded) {
      if (event.index >= 0 && event.index < currentState.screens.length) {
        emit(currentState.copyWith(
          currentIndex: event.index,
          isLastScreen: event.index == currentState.screens.length - 1,
        ));
      }
    }
  }
}
