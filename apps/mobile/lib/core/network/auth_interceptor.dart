import 'package:dio/dio.dart';

import '../services/secure_storage_service.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';

/// Dio interceptor that handles JWT authentication.
///
/// - Injects Bearer token into all requests when available
/// - Handles 401 responses with automatic token refresh
/// - Queues concurrent requests during refresh to prevent race conditions
class AuthInterceptor extends Interceptor {
  final SecureStorageService _secureStorage;
  final AuthRepository _authRepository;
  final Dio _dio;
  final String _deviceId;

  bool _isRefreshing = false;
  final List<({RequestOptions options, ErrorInterceptorHandler handler})>
      _pendingRequests = [];

  AuthInterceptor({
    required SecureStorageService secureStorage,
    required AuthRepository authRepository,
    required Dio dio,
    required String deviceId,
  })  : _secureStorage = secureStorage,
        _authRepository = authRepository,
        _dio = dio,
        _deviceId = deviceId;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _secureStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  /// Paths where a 401 means a business-logic error (e.g. wrong password),
  /// NOT an expired token. These should never trigger a token refresh.
  static const _noRefreshPaths = [
    '/app-auth/email-change/request',
    '/app-auth/login-email',
    '/app-auth/delete-account',
  ];

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401) {
      handler.next(err);
      return;
    }

    // Don't retry if this request was already retried after a token refresh.
    if (err.requestOptions.extra['_retried'] == true) {
      handler.next(err);
      return;
    }

    // Don't refresh for endpoints where 401 = business logic (wrong password).
    final path = err.requestOptions.path;
    if (_noRefreshPaths.any((p) => path.contains(p))) {
      handler.next(err);
      return;
    }

    // If refresh is already in progress, queue this request
    if (_isRefreshing) {
      _pendingRequests.add((options: err.requestOptions, handler: handler));
      return;
    }

    _isRefreshing = true;

    try {
      final refreshToken = await _secureStorage.getRefreshToken();
      if (refreshToken == null) {
        _failAllPending(err);
        handler.next(err);
        return;
      }

      final result = await _authRepository.refreshTokens(
        refreshToken: refreshToken,
        deviceId: _deviceId,
      );

      result.fold(
        (failure) {
          // Refresh failed — clear tokens and fail all pending
          _secureStorage.clearTokens();
          _failAllPending(err);
          handler.next(err);
        },
        (tokens) async {
          // Retry original request with new token
          final retryOptions = err.requestOptions;
          retryOptions.headers['Authorization'] =
              'Bearer ${tokens.accessToken}';
          retryOptions.extra['_retried'] = true;

          try {
            final response = await _dio.fetch(retryOptions);
            handler.resolve(response);
          } catch (e) {
            handler.next(
              e is DioException
                  ? e
                  : DioException(
                      requestOptions: retryOptions,
                      error: e,
                    ),
            );
          }

          // Retry all queued requests with new token
          _retryPendingRequests(tokens.accessToken);
        },
      );
    } catch (e) {
      _failAllPending(err);
      handler.next(err);
    } finally {
      _isRefreshing = false;
    }
  }

  void _retryPendingRequests(String newAccessToken) {
    final pending = List.of(_pendingRequests);
    _pendingRequests.clear();

    for (final request in pending) {
      request.options.headers['Authorization'] = 'Bearer $newAccessToken';
      request.options.extra['_retried'] = true;
      _dio.fetch(request.options).then(
            (response) => request.handler.resolve(response),
            onError: (error) => request.handler.next(
              error is DioException
                  ? error
                  : DioException(
                      requestOptions: request.options,
                      error: error,
                    ),
            ),
          );
    }
  }

  void _failAllPending(DioException err) {
    final pending = List.of(_pendingRequests);
    _pendingRequests.clear();
    for (final request in pending) {
      request.handler.next(
        DioException(
          requestOptions: request.options,
          error: err.error,
          response: err.response,
          type: err.type,
        ),
      );
    }
  }
}
