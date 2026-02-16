/// Exception thrown when a server request fails.
class ServerException implements Exception {
  final String? message;
  final int? statusCode;

  const ServerException({this.message, this.statusCode});

  @override
  String toString() => 'ServerException(message: $message, statusCode: $statusCode)';
}

/// Exception thrown when a cache operation fails.
class CacheException implements Exception {
  final String? message;

  const CacheException({this.message});

  @override
  String toString() => 'CacheException(message: $message)';
}

/// Exception thrown when the device has no internet connection.
class NetworkException implements Exception {
  const NetworkException();

  @override
  String toString() => 'NetworkException: No internet connection';
}
