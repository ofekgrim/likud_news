import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/services/secure_storage_service.dart';
import '../../../../core/usecases/usecase.dart';
import '../../../auth/domain/entities/app_user.dart';
import '../../../auth/domain/repositories/auth_repository.dart';
import '../../domain/usecases/get_profile.dart';
import '../../domain/usecases/request_membership.dart';
import '../../domain/usecases/update_avatar.dart';
import '../../domain/usecases/update_profile.dart';
import '../../domain/usecases/change_password.dart';
import '../../domain/usecases/upload_and_set_avatar.dart';
import '../../domain/usecases/request_phone_change.dart';
import '../../domain/usecases/verify_phone_change.dart';
import '../../domain/usecases/request_email_change.dart';
import '../../domain/usecases/verify_email_change.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/// Base class for all UserProfile BLoC events.
sealed class UserProfileEvent extends Equatable {
  const UserProfileEvent();

  @override
  List<Object?> get props => [];
}

/// Triggers loading of the authenticated user's profile.
final class LoadProfile extends UserProfileEvent {
  const LoadProfile();
}

/// Updates display name, bio, phone, email, categories, or notification preferences.
final class UpdateProfileEvent extends UserProfileEvent {
  final String? displayName;
  final String? bio;
  final String? phone;
  final String? email;
  final List<String>? preferredCategories;
  final Map<String, dynamic>? notificationPrefs;

  const UpdateProfileEvent({
    this.displayName,
    this.bio,
    this.phone,
    this.email,
    this.preferredCategories,
    this.notificationPrefs,
  });

  @override
  List<Object?> get props => [
        displayName,
        bio,
        phone,
        email,
        preferredCategories,
        notificationPrefs,
      ];
}

/// Updates the user's avatar image URL.
final class UpdateAvatarEvent extends UserProfileEvent {
  final String avatarUrl;

  const UpdateAvatarEvent({required this.avatarUrl});

  @override
  List<Object?> get props => [avatarUrl];
}

/// Requests membership verification for the user.
final class RequestMembershipEvent extends UserProfileEvent {
  final String membershipId;
  final String? fullName;

  const RequestMembershipEvent({
    required this.membershipId,
    this.fullName,
  });

  @override
  List<Object?> get props => [membershipId, fullName];
}

/// Picks a local image file, uploads it, and sets it as the user's avatar.
final class PickAndUploadAvatarEvent extends UserProfileEvent {
  final String filePath;

  const PickAndUploadAvatarEvent({required this.filePath});

  @override
  List<Object?> get props => [filePath];
}

/// Changes the user's password.
final class ChangePasswordEvent extends UserProfileEvent {
  final String currentPassword;
  final String newPassword;

  const ChangePasswordEvent({
    required this.currentPassword,
    required this.newPassword,
  });

  @override
  List<Object?> get props => [currentPassword, newPassword];
}

/// Requests OTP for phone number change.
final class RequestPhoneChangeEvent extends UserProfileEvent {
  final String phone;
  const RequestPhoneChangeEvent({required this.phone});

  @override
  List<Object?> get props => [phone];
}

/// Verifies OTP and updates phone number.
final class VerifyPhoneChangeEvent extends UserProfileEvent {
  final String phone;
  final String code;
  const VerifyPhoneChangeEvent({required this.phone, required this.code});

  @override
  List<Object?> get props => [phone, code];
}

/// Requests verification code for email change (requires password).
final class RequestEmailChangeEvent extends UserProfileEvent {
  final String email;
  final String currentPassword;
  const RequestEmailChangeEvent({
    required this.email,
    required this.currentPassword,
  });

  @override
  List<Object?> get props => [email, currentPassword];
}

/// Verifies code and updates email address.
final class VerifyEmailChangeEvent extends UserProfileEvent {
  final String email;
  final String code;
  const VerifyEmailChangeEvent({required this.email, required this.code});

  @override
  List<Object?> get props => [email, code];
}

/// Deletes the user's account permanently (requires password confirmation).
final class DeleteAccountEvent extends UserProfileEvent {
  final String password;
  const DeleteAccountEvent({required this.password});

  @override
  List<Object?> get props => [password];
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/// Base class for all UserProfile BLoC states.
sealed class UserProfileState extends Equatable {
  const UserProfileState();

  @override
  List<Object?> get props => [];
}

/// Initial state before any profile data has been requested.
final class UserProfileInitial extends UserProfileState {
  const UserProfileInitial();
}

/// Profile data is being fetched for the first time.
final class UserProfileLoading extends UserProfileState {
  const UserProfileLoading();
}

/// Profile data loaded successfully.
final class UserProfileLoaded extends UserProfileState {
  final AppUser user;

  const UserProfileLoaded({required this.user});

  @override
  List<Object?> get props => [user];
}

/// An error occurred while loading or updating the profile.
final class UserProfileError extends UserProfileState {
  final String message;

  const UserProfileError({required this.message});

  @override
  List<Object?> get props => [message];
}

/// A profile update (profile fields, avatar, or membership) is in progress.
final class UserProfileUpdating extends UserProfileState {
  const UserProfileUpdating();
}

/// Profile was updated successfully.
final class UserProfileUpdated extends UserProfileState {
  final AppUser user;

  const UserProfileUpdated({required this.user});

  @override
  List<Object?> get props => [user];
}

/// Password was changed successfully.
final class PasswordChanged extends UserProfileState {
  const PasswordChanged();
}

/// OTP was sent to the new phone number.
final class PhoneOtpSent extends UserProfileState {
  final String phone;
  const PhoneOtpSent({required this.phone});

  @override
  List<Object?> get props => [phone];
}

/// Verification code was sent to the new email.
final class EmailCodeSent extends UserProfileState {
  final String email;
  const EmailCodeSent({required this.email});

  @override
  List<Object?> get props => [email];
}

/// Phone was verified and updated successfully.
final class PhoneVerified extends UserProfileState {
  final AppUser user;
  const PhoneVerified({required this.user});

  @override
  List<Object?> get props => [user];
}

/// Email was verified and updated successfully.
final class EmailVerified extends UserProfileState {
  final AppUser user;
  const EmailVerified({required this.user});

  @override
  List<Object?> get props => [user];
}

/// Account was deleted successfully.
final class AccountDeleted extends UserProfileState {
  const AccountDeleted();
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

/// Manages the state of the user profile feature.
///
/// Handles loading the profile, editing profile fields, updating avatar,
/// and requesting membership verification.
@injectable
class UserProfileBloc extends Bloc<UserProfileEvent, UserProfileState> {
  final GetProfile _getProfile;
  final UpdateProfile _updateProfile;
  final UpdateAvatar _updateAvatar;
  final UploadAndSetAvatar _uploadAndSetAvatar;
  final RequestMembership _requestMembership;
  final ChangePassword _changePassword;
  final RequestPhoneChange _requestPhoneChange;
  final VerifyPhoneChange _verifyPhoneChange;
  final RequestEmailChange _requestEmailChange;
  final VerifyEmailChange _verifyEmailChange;
  final AuthRepository _authRepository;
  final SecureStorageService _secureStorage;

  UserProfileBloc(
    this._getProfile,
    this._updateProfile,
    this._updateAvatar,
    this._uploadAndSetAvatar,
    this._requestMembership,
    this._changePassword,
    this._requestPhoneChange,
    this._verifyPhoneChange,
    this._requestEmailChange,
    this._verifyEmailChange,
    this._authRepository,
    this._secureStorage,
  ) : super(const UserProfileInitial()) {
    on<LoadProfile>(_onLoadProfile);
    on<UpdateProfileEvent>(_onUpdateProfile);
    on<UpdateAvatarEvent>(_onUpdateAvatar);
    on<PickAndUploadAvatarEvent>(_onPickAndUploadAvatar);
    on<RequestMembershipEvent>(_onRequestMembership);
    on<ChangePasswordEvent>(_onChangePassword);
    on<RequestPhoneChangeEvent>(_onRequestPhoneChange);
    on<VerifyPhoneChangeEvent>(_onVerifyPhoneChange);
    on<RequestEmailChangeEvent>(_onRequestEmailChange);
    on<VerifyEmailChangeEvent>(_onVerifyEmailChange);
    on<DeleteAccountEvent>(_onDeleteAccount);
  }

  /// Loads the user's profile from the API.
  Future<void> _onLoadProfile(
    LoadProfile event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(const UserProfileLoading());

    final result = await _getProfile(const NoParams());

    result.fold(
      (failure) => emit(UserProfileError(
        message: failure.message ?? 'Failed to load profile',
      )),
      (user) => emit(UserProfileLoaded(user: user)),
    );
  }

  /// Updates the user's profile fields.
  Future<void> _onUpdateProfile(
    UpdateProfileEvent event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(const UserProfileUpdating());

    final result = await _updateProfile(UpdateProfileParams(
      displayName: event.displayName,
      bio: event.bio,
      phone: event.phone,
      email: event.email,
      preferredCategories: event.preferredCategories,
      notificationPrefs: event.notificationPrefs,
    ));

    result.fold(
      (failure) => emit(UserProfileError(
        message: failure.message ?? 'Failed to update profile',
      )),
      (user) => emit(UserProfileUpdated(user: user)),
    );
  }

  /// Updates the user's avatar.
  Future<void> _onUpdateAvatar(
    UpdateAvatarEvent event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(const UserProfileUpdating());

    final result = await _updateAvatar(UpdateAvatarParams(
      avatarUrl: event.avatarUrl,
    ));

    result.fold(
      (failure) => emit(UserProfileError(
        message: failure.message ?? 'Failed to update avatar',
      )),
      (user) => emit(UserProfileUpdated(user: user)),
    );
  }

  /// Uploads a local image file and sets it as the user's avatar.
  Future<void> _onPickAndUploadAvatar(
    PickAndUploadAvatarEvent event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(const UserProfileUpdating());

    final result = await _uploadAndSetAvatar(UploadAndSetAvatarParams(
      filePath: event.filePath,
    ));

    result.fold(
      (failure) => emit(UserProfileError(
        message: failure.message ?? 'Failed to upload avatar',
      )),
      (user) => emit(UserProfileUpdated(user: user)),
    );
  }

  /// Requests membership verification.
  Future<void> _onRequestMembership(
    RequestMembershipEvent event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(const UserProfileUpdating());

    final result = await _requestMembership(RequestMembershipParams(
      membershipId: event.membershipId,
      fullName: event.fullName,
    ));

    result.fold(
      (failure) => emit(UserProfileError(
        message: failure.message ?? 'Failed to request verification',
      )),
      (user) => emit(UserProfileUpdated(user: user)),
    );
  }

  /// Changes the user's password.
  Future<void> _onChangePassword(
    ChangePasswordEvent event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(const UserProfileUpdating());

    final result = await _changePassword(ChangePasswordParams(
      currentPassword: event.currentPassword,
      newPassword: event.newPassword,
    ));

    result.fold(
      (failure) => emit(UserProfileError(
        message: failure.message ?? 'Failed to change password',
      )),
      (_) => emit(const PasswordChanged()),
    );
  }

  /// Requests OTP for phone number change.
  Future<void> _onRequestPhoneChange(
    RequestPhoneChangeEvent event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(const UserProfileUpdating());

    final result = await _requestPhoneChange(
      RequestPhoneChangeParams(phone: event.phone),
    );

    result.fold(
      (failure) => emit(UserProfileError(
        message: failure.message ?? 'Failed to send verification code',
      )),
      (_) => emit(PhoneOtpSent(phone: event.phone)),
    );
  }

  /// Verifies OTP and updates phone number.
  Future<void> _onVerifyPhoneChange(
    VerifyPhoneChangeEvent event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(const UserProfileUpdating());

    final result = await _verifyPhoneChange(
      VerifyPhoneChangeParams(phone: event.phone, code: event.code),
    );

    result.fold(
      (failure) => emit(UserProfileError(
        message: failure.message ?? 'Invalid verification code',
      )),
      (user) => emit(PhoneVerified(user: user)),
    );
  }

  /// Requests verification code for email change.
  Future<void> _onRequestEmailChange(
    RequestEmailChangeEvent event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(const UserProfileUpdating());

    final result = await _requestEmailChange(
      RequestEmailChangeParams(
        email: event.email,
        currentPassword: event.currentPassword,
      ),
    );

    result.fold(
      (failure) => emit(UserProfileError(
        message: failure.message ?? 'Failed to send verification code',
      )),
      (_) => emit(EmailCodeSent(email: event.email)),
    );
  }

  /// Verifies code and updates email address.
  Future<void> _onVerifyEmailChange(
    VerifyEmailChangeEvent event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(const UserProfileUpdating());

    final result = await _verifyEmailChange(
      VerifyEmailChangeParams(email: event.email, code: event.code),
    );

    result.fold(
      (failure) => emit(UserProfileError(
        message: failure.message ?? 'Invalid verification code',
      )),
      (user) => emit(EmailVerified(user: user)),
    );
  }

  /// Deletes the user's account permanently.
  Future<void> _onDeleteAccount(
    DeleteAccountEvent event,
    Emitter<UserProfileState> emit,
  ) async {
    emit(const UserProfileUpdating());

    final result = await _authRepository.deleteAccount(
      password: event.password,
    );

    result.fold(
      (failure) => emit(UserProfileError(
        message: failure.message ?? 'Failed to delete account',
      )),
      (_) async {
        await _secureStorage.clearTokens();
        emit(const AccountDeleted());
      },
    );
  }
}
