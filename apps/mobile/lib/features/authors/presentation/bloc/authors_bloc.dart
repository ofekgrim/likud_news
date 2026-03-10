import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../../article_detail/domain/entities/author.dart';
import '../../domain/usecases/get_authors.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

sealed class AuthorsEvent extends Equatable {
  const AuthorsEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of all authors.
final class LoadAuthors extends AuthorsEvent {
  const LoadAuthors();
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

sealed class AuthorsState extends Equatable {
  const AuthorsState();

  @override
  List<Object?> get props => [];
}

final class AuthorsInitial extends AuthorsState {
  const AuthorsInitial();
}

final class AuthorsLoading extends AuthorsState {
  const AuthorsLoading();
}

final class AuthorsLoaded extends AuthorsState {
  final List<Author> authors;

  const AuthorsLoaded({required this.authors});

  @override
  List<Object?> get props => [authors];
}

final class AuthorsError extends AuthorsState {
  final String message;

  const AuthorsError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

@injectable
class AuthorsBloc extends Bloc<AuthorsEvent, AuthorsState> {
  final GetAuthors _getAuthors;

  AuthorsBloc(this._getAuthors) : super(const AuthorsInitial()) {
    on<LoadAuthors>(_onLoadAuthors);
  }

  Future<void> _onLoadAuthors(
    LoadAuthors event,
    Emitter<AuthorsState> emit,
  ) async {
    emit(const AuthorsLoading());

    final result = await _getAuthors(const NoParams());

    result.fold(
      (failure) => emit(AuthorsError(
        message: failure.message ?? 'Failed to load authors',
      )),
      (authors) => emit(AuthorsLoaded(authors: authors)),
    );
  }
}
