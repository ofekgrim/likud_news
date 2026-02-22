import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../../home/domain/entities/story.dart';
import '../../../home/domain/usecases/get_stories.dart';

// Events
sealed class StoriesEvent extends Equatable {
  const StoriesEvent();
  @override
  List<Object?> get props => [];
}

class LoadStories extends StoriesEvent {
  const LoadStories();
}

class RefreshStories extends StoriesEvent {
  const RefreshStories();
}

// States
sealed class StoriesState extends Equatable {
  const StoriesState();
  @override
  List<Object?> get props => [];
}

class StoriesInitial extends StoriesState {
  const StoriesInitial();
}

class StoriesLoading extends StoriesState {
  const StoriesLoading();
}

class StoriesLoaded extends StoriesState {
  final List<Story> stories;
  const StoriesLoaded({required this.stories});
  @override
  List<Object?> get props => [stories];
}

class StoriesError extends StoriesState {
  final String message;
  const StoriesError(this.message);
  @override
  List<Object?> get props => [message];
}

// BLoC
@injectable
class StoriesBloc extends Bloc<StoriesEvent, StoriesState> {
  final GetStories _getStories;

  StoriesBloc(this._getStories) : super(const StoriesInitial()) {
    on<LoadStories>(_onLoad);
    on<RefreshStories>(_onRefresh);
  }

  Future<void> _onLoad(LoadStories event, Emitter<StoriesState> emit) async {
    emit(const StoriesLoading());
    final result = await _getStories(const NoParams());
    result.fold(
      (failure) =>
          emit(StoriesError(failure.message ?? 'Failed to load stories')),
      (stories) => emit(StoriesLoaded(stories: stories)),
    );
  }

  Future<void> _onRefresh(
      RefreshStories event, Emitter<StoriesState> emit) async {
    final result = await _getStories(const NoParams());
    result.fold(
      (failure) {}, // Silently fail on refresh
      (stories) => emit(StoriesLoaded(stories: stories)),
    );
  }
}
