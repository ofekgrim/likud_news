import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';

import '../../../../core/errors/failures.dart';
import '../../../../core/services/device_id_service.dart';
import '../../../../core/services/secure_storage_service.dart';
import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/app_user.dart';
import '../../domain/usecases/login_email.dart';
import '../../domain/usecases/logout.dart';
import '../../domain/usecases/register_email.dart';
import '../../domain/usecases/request_otp.dart';
import '../../domain/usecases/restore_session.dart';
import '../../domain/usecases/verify_otp.dart';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

sealed class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class CheckAuthStatus extends AuthEvent {
  const CheckAuthStatus();
}

class RequestOtpEvent extends AuthEvent {
  final String phone;
  const RequestOtpEvent({required this.phone});

  @override
  List<Object?> get props => [phone];
}

class VerifyOtpEvent extends AuthEvent {
  final String phone;
  final String code;
  const VerifyOtpEvent({required this.phone, required this.code});

  @override
  List<Object?> get props => [phone, code];
}

class LoginEmailEvent extends AuthEvent {
  final String email;
  final String password;
  const LoginEmailEvent({required this.email, required this.password});

  @override
  List<Object?> get props => [email, password];
}

class RegisterEmailEvent extends AuthEvent {
  final String email;
  final String password;
  final String? displayName;
  final String? phone;
  const RegisterEmailEvent({
    required this.email,
    required this.password,
    this.displayName,
    this.phone,
  });

  @override
  List<Object?> get props => [email, password, displayName, phone];
}

class LogoutEvent extends AuthEvent {
  const LogoutEvent();
}

class ClearAuthError extends AuthEvent {
  const ClearAuthError();
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

sealed class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {
  const AuthInitial();
}

class AuthLoading extends AuthState {
  const AuthLoading();
}

class AuthUnauthenticated extends AuthState {
  const AuthUnauthenticated();
}

class OtpSent extends AuthState {
  final String phone;
  const OtpSent({required this.phone});

  @override
  List<Object?> get props => [phone];
}

class AuthAuthenticated extends AuthState {
  final AppUser user;
  const AuthAuthenticated({required this.user});

  @override
  List<Object?> get props => [user];
}

class AuthUserNotFound extends AuthState {
  final String identifier;
  final bool isPhone;
  const AuthUserNotFound({required this.identifier, required this.isPhone});

  @override
  List<Object?> get props => [identifier, isPhone];
}

class AuthError extends AuthState {
  final String message;
  final AuthState previousState;
  const AuthError({required this.message, required this.previousState});

  @override
  List<Object?> get props => [message, previousState];
}

// ---------------------------------------------------------------------------
// BLoC
// ---------------------------------------------------------------------------

@lazySingleton
class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final RequestOtp _requestOtp;
  final VerifyOtp _verifyOtp;
  final LoginEmail _loginEmail;
  final RegisterEmail _registerEmail;
  final Logout _logout;
  final DeviceIdService _deviceIdService;
  final SecureStorageService _secureStorage;
  final RestoreSession _restoreSession;

  AuthBloc(
    this._requestOtp,
    this._verifyOtp,
    this._loginEmail,
    this._registerEmail,
    this._logout,
    this._deviceIdService,
    this._secureStorage,
    this._restoreSession,
  ) : super(const AuthInitial()) {
    on<CheckAuthStatus>(_onCheckAuthStatus);
    on<RequestOtpEvent>(_onRequestOtp);
    on<VerifyOtpEvent>(_onVerifyOtp);
    on<LoginEmailEvent>(_onLoginEmail);
    on<RegisterEmailEvent>(_onRegisterEmail);
    on<LogoutEvent>(_onLogout);
    on<ClearAuthError>(_onClearError);
  }

  Future<void> _onCheckAuthStatus(
    CheckAuthStatus event,
    Emitter<AuthState> emit,
  ) async {
    final hasTokens = await _secureStorage.hasTokens();
    if (!hasTokens) {
      emit(const AuthUnauthenticated());
      return;
    }
    emit(const AuthLoading());
    final result = await _restoreSession(const NoParams());
    result.fold(
      (failure) => emit(const AuthUnauthenticated()),
      (user) => emit(AuthAuthenticated(user: user)),
    );
  }

  Future<void> _onRequestOtp(
    RequestOtpEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await _requestOtp(
      RequestOtpParams(phone: event.phone),
    );
    result.fold(
      (failure) {
        if (failure is NotFoundFailure) {
          emit(AuthUserNotFound(identifier: event.phone, isPhone: true));
        } else {
          emit(AuthError(
            message: failure.message ?? 'Failed to send OTP',
            previousState: const AuthUnauthenticated(),
          ));
        }
      },
      (_) => emit(OtpSent(phone: event.phone)),
    );
  }

  Future<void> _onVerifyOtp(
    VerifyOtpEvent event,
    Emitter<AuthState> emit,
  ) async {
    final previousState = state;
    emit(const AuthLoading());
    final result = await _verifyOtp(
      VerifyOtpParams(
        phone: event.phone,
        code: event.code,
        deviceId: _deviceIdService.deviceId,
      ),
    );
    result.fold(
      (failure) => emit(AuthError(
        message: failure.message ?? 'Invalid OTP code',
        previousState: previousState,
      )),
      (data) => emit(AuthAuthenticated(user: data.user)),
    );
  }

  Future<void> _onLoginEmail(
    LoginEmailEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await _loginEmail(
      LoginEmailParams(
        email: event.email,
        password: event.password,
        deviceId: _deviceIdService.deviceId,
      ),
    );
    result.fold(
      (failure) {
        if (failure is NotFoundFailure) {
          emit(AuthUserNotFound(identifier: event.email, isPhone: false));
        } else {
          emit(AuthError(
            message: failure.message ?? 'Login failed',
            previousState: const AuthUnauthenticated(),
          ));
        }
      },
      (data) => emit(AuthAuthenticated(user: data.user)),
    );
  }

  Future<void> _onRegisterEmail(
    RegisterEmailEvent event,
    Emitter<AuthState> emit,
  ) async {
    emit(const AuthLoading());
    final result = await _registerEmail(
      RegisterEmailParams(
        email: event.email,
        password: event.password,
        deviceId: _deviceIdService.deviceId,
        displayName: event.displayName,
        phone: event.phone,
      ),
    );
    result.fold(
      (failure) => emit(AuthError(
        message: failure.message ?? 'Registration failed',
        previousState: const AuthUnauthenticated(),
      )),
      (data) => emit(AuthAuthenticated(user: data.user)),
    );
  }

  Future<void> _onLogout(
    LogoutEvent event,
    Emitter<AuthState> emit,
  ) async {
    await _logout(LogoutParams(deviceId: _deviceIdService.deviceId));
    emit(const AuthUnauthenticated());
  }

  void _onClearError(
    ClearAuthError event,
    Emitter<AuthState> emit,
  ) {
    if (state is AuthError) {
      emit((state as AuthError).previousState);
    }
  }
}
