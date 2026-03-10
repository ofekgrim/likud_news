import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/bookmark_folder.dart';
import '../../domain/usecases/create_folder.dart';
import '../../domain/usecases/delete_folder.dart';
import '../../domain/usecases/get_folders.dart';
import '../../domain/usecases/update_folder.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all Enhanced Favorites BLoC events.
sealed class EnhancedFavoritesEvent extends Equatable {
  const EnhancedFavoritesEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of all bookmark folders.
final class LoadFolders extends EnhancedFavoritesEvent {
  const LoadFolders();
}

/// Creates a new bookmark folder with the given [name] and optional [color].
final class CreateFolderEvent extends EnhancedFavoritesEvent {
  final String name;
  final String? color;

  const CreateFolderEvent({required this.name, this.color});

  @override
  List<Object?> get props => [name, color];
}

/// Updates an existing folder's properties.
final class UpdateFolderEvent extends EnhancedFavoritesEvent {
  final String id;
  final String? name;
  final String? color;
  final int? sortOrder;
  final bool? isPublic;

  const UpdateFolderEvent({
    required this.id,
    this.name,
    this.color,
    this.sortOrder,
    this.isPublic,
  });

  @override
  List<Object?> get props => [id, name, color, sortOrder, isPublic];
}

/// Deletes a bookmark folder by [id].
final class DeleteFolderEvent extends EnhancedFavoritesEvent {
  final String id;

  const DeleteFolderEvent(this.id);

  @override
  List<Object?> get props => [id];
}

/// Selects a folder to filter favorites by, or null for all favorites.
final class SelectFolder extends EnhancedFavoritesEvent {
  final String? folderId;

  const SelectFolder(this.folderId);

  @override
  List<Object?> get props => [folderId];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all Enhanced Favorites BLoC states.
sealed class EnhancedFavoritesState extends Equatable {
  const EnhancedFavoritesState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any data has been requested.
final class EnhancedFavoritesInitial extends EnhancedFavoritesState {
  const EnhancedFavoritesInitial();
}

/// Folders are being fetched.
final class EnhancedFavoritesLoading extends EnhancedFavoritesState {
  const EnhancedFavoritesLoading();
}

/// Folders loaded successfully.
final class EnhancedFavoritesLoaded extends EnhancedFavoritesState {
  final List<BookmarkFolder> folders;
  final String? selectedFolderId;

  const EnhancedFavoritesLoaded({
    this.folders = const [],
    this.selectedFolderId,
  });

  /// Creates a copy with optional overrides.
  EnhancedFavoritesLoaded copyWith({
    List<BookmarkFolder>? folders,
    String? Function()? selectedFolderId,
  }) {
    return EnhancedFavoritesLoaded(
      folders: folders ?? this.folders,
      selectedFolderId: selectedFolderId != null
          ? selectedFolderId()
          : this.selectedFolderId,
    );
  }

  @override
  List<Object?> get props => [folders, selectedFolderId];
}

/// An error occurred while loading or managing folders.
final class EnhancedFavoritesError extends EnhancedFavoritesState {
  final String message;

  const EnhancedFavoritesError({required this.message});

  @override
  List<Object?> get props => [message];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state for bookmark folders and enhanced favorites.
///
/// Supports CRUD operations on folders and folder selection
/// for filtering favorites.
@injectable
class EnhancedFavoritesBloc
    extends Bloc<EnhancedFavoritesEvent, EnhancedFavoritesState> {
  final GetFolders _getFolders;
  final CreateFolder _createFolder;
  final UpdateFolder _updateFolder;
  final DeleteFolder _deleteFolder;

  EnhancedFavoritesBloc(
    this._getFolders,
    this._createFolder,
    this._updateFolder,
    this._deleteFolder,
  ) : super(const EnhancedFavoritesInitial()) {
    on<LoadFolders>(_onLoadFolders);
    on<CreateFolderEvent>(_onCreateFolder);
    on<UpdateFolderEvent>(_onUpdateFolder);
    on<DeleteFolderEvent>(_onDeleteFolder);
    on<SelectFolder>(_onSelectFolder);
  }

  /// Loads all bookmark folders for the authenticated user.
  Future<void> _onLoadFolders(
    LoadFolders event,
    Emitter<EnhancedFavoritesState> emit,
  ) async {
    emit(const EnhancedFavoritesLoading());

    final result = await _getFolders(const NoParams());

    result.fold(
      (failure) => emit(EnhancedFavoritesError(
        message: failure.message ?? 'error_loading_folders'.tr(),
      )),
      (folders) => emit(EnhancedFavoritesLoaded(folders: folders)),
    );
  }

  /// Creates a new folder and appends it to the loaded list.
  Future<void> _onCreateFolder(
    CreateFolderEvent event,
    Emitter<EnhancedFavoritesState> emit,
  ) async {
    final currentState = state;
    final currentFolders = currentState is EnhancedFavoritesLoaded
        ? currentState.folders
        : <BookmarkFolder>[];

    final result = await _createFolder(
      CreateFolderParams(name: event.name, color: event.color),
    );

    result.fold(
      (failure) => emit(EnhancedFavoritesError(
        message: failure.message ?? 'error_creating_folder'.tr(),
      )),
      (folder) => emit(EnhancedFavoritesLoaded(
        folders: [...currentFolders, folder],
        selectedFolderId: currentState is EnhancedFavoritesLoaded
            ? currentState.selectedFolderId
            : null,
      )),
    );
  }

  /// Updates a folder and replaces it in the loaded list.
  Future<void> _onUpdateFolder(
    UpdateFolderEvent event,
    Emitter<EnhancedFavoritesState> emit,
  ) async {
    final currentState = state;
    if (currentState is! EnhancedFavoritesLoaded) return;

    final result = await _updateFolder(
      UpdateFolderParams(
        id: event.id,
        name: event.name,
        color: event.color,
        sortOrder: event.sortOrder,
        isPublic: event.isPublic,
      ),
    );

    result.fold(
      (failure) => emit(EnhancedFavoritesError(
        message: failure.message ?? 'error_updating_folder'.tr(),
      )),
      (updatedFolder) {
        final updatedFolders = currentState.folders.map((f) {
          return f.id == event.id ? updatedFolder : f;
        }).toList();
        emit(currentState.copyWith(folders: updatedFolders));
      },
    );
  }

  /// Deletes a folder and removes it from the loaded list.
  Future<void> _onDeleteFolder(
    DeleteFolderEvent event,
    Emitter<EnhancedFavoritesState> emit,
  ) async {
    final currentState = state;
    if (currentState is! EnhancedFavoritesLoaded) return;

    // Optimistically remove from the UI.
    final updatedFolders =
        currentState.folders.where((f) => f.id != event.id).toList();
    final newSelectedId = currentState.selectedFolderId == event.id
        ? null
        : currentState.selectedFolderId;
    emit(EnhancedFavoritesLoaded(
      folders: updatedFolders,
      selectedFolderId: newSelectedId,
    ));

    final result = await _deleteFolder(DeleteFolderParams(id: event.id));

    result.fold(
      (failure) {
        // On failure, restore the original list.
        emit(currentState);
      },
      (_) {
        // Success — list already updated optimistically.
      },
    );
  }

  /// Selects a folder to filter favorites by.
  void _onSelectFolder(
    SelectFolder event,
    Emitter<EnhancedFavoritesState> emit,
  ) {
    final currentState = state;
    if (currentState is! EnhancedFavoritesLoaded) return;

    emit(currentState.copyWith(
      selectedFolderId: () => event.folderId,
    ));
  }
}
