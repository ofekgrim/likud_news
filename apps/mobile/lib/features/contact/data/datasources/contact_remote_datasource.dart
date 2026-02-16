import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/api_client.dart';

/// Remote datasource for submitting contact forms.
///
/// Sends a POST request to [ApiConstants.contact] with the form data.
abstract class ContactRemoteDatasource {
  /// Submits a contact form.
  ///
  /// Throws [ServerException] on failure.
  Future<void> submitContact({
    required String name,
    required String email,
    String? phone,
    required String subject,
    required String message,
  });
}

@LazySingleton(as: ContactRemoteDatasource)
class ContactRemoteDatasourceImpl implements ContactRemoteDatasource {
  final ApiClient _apiClient;

  ContactRemoteDatasourceImpl(this._apiClient);

  @override
  Future<void> submitContact({
    required String name,
    required String email,
    String? phone,
    required String subject,
    required String message,
  }) async {
    try {
      await _apiClient.post<dynamic>(
        ApiConstants.contact,
        data: {
          'name': name,
          'email': email,
          if (phone != null && phone.isNotEmpty) 'phone': phone,
          'subject': subject,
          'message': message,
        },
      );
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException(message: e.toString());
    }
  }
}
