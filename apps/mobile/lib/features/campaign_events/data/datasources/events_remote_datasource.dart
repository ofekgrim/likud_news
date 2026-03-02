import 'package:injectable/injectable.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/event_rsvp.dart';
import '../models/campaign_event_model.dart';
import '../models/event_rsvp_model.dart';

/// Contract for the campaign events remote data source.
abstract class EventsRemoteDataSource {
  /// Fetches a paginated list of campaign events.
  ///
  /// Throws a [DioException] on failure.
  Future<List<CampaignEventModel>> getEvents({
    required int page,
    String? district,
    String? candidateId,
    bool? upcoming,
  });

  /// Fetches a single campaign event by [id].
  ///
  /// Throws a [DioException] on failure.
  Future<CampaignEventModel> getEvent(String id);

  /// Submits or updates an RSVP for the event with [eventId].
  ///
  /// Throws a [DioException] on failure.
  Future<EventRsvpModel> rsvpToEvent({
    required String eventId,
    required RsvpStatus status,
  });

  /// Fetches the current user's RSVP for the event with [eventId].
  ///
  /// Returns `null` if the user has not RSVP'd.
  /// Throws a [DioException] on failure.
  Future<EventRsvpModel?> getMyRsvp(String eventId);
}

/// Implementation of [EventsRemoteDataSource] using [ApiClient].
@LazySingleton(as: EventsRemoteDataSource)
class EventsRemoteDataSourceImpl implements EventsRemoteDataSource {
  final ApiClient _apiClient;

  EventsRemoteDataSourceImpl(this._apiClient);

  @override
  Future<List<CampaignEventModel>> getEvents({
    required int page,
    String? district,
    String? candidateId,
    bool? upcoming,
  }) async {
    final queryParameters = <String, dynamic>{
      'page': page,
      'limit': 20,
    };
    if (district != null) queryParameters['district'] = district;
    if (candidateId != null) queryParameters['candidateId'] = candidateId;
    if (upcoming != null) queryParameters['upcoming'] = upcoming;

    final response = await _apiClient.get(
      ApiConstants.campaignEvents,
      queryParameters: queryParameters,
    );
    final data = response.data;
    final List<dynamic> items =
        data is Map<String, dynamic> && data.containsKey('data')
            ? data['data'] as List<dynamic>
            : data as List<dynamic>;
    return items
        .map((json) =>
            CampaignEventModel.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<CampaignEventModel> getEvent(String id) async {
    final response =
        await _apiClient.get('${ApiConstants.campaignEvents}/$id');
    final data = response.data as Map<String, dynamic>;
    final eventJson =
        data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return CampaignEventModel.fromJson(eventJson);
  }

  @override
  Future<EventRsvpModel> rsvpToEvent({
    required String eventId,
    required RsvpStatus status,
  }) async {
    final response = await _apiClient.post(
      '${ApiConstants.campaignEvents}/$eventId/rsvp',
      data: {'status': status.toApiValue()},
    );
    final data = response.data as Map<String, dynamic>;
    final rsvpJson =
        data.containsKey('data') ? data['data'] as Map<String, dynamic> : data;
    return EventRsvpModel.fromJson(rsvpJson);
  }

  @override
  Future<EventRsvpModel?> getMyRsvp(String eventId) async {
    final response = await _apiClient.get(
      '${ApiConstants.campaignEvents}/$eventId/my-rsvp',
    );
    final data = response.data;
    if (data == null) return null;
    final Map<String, dynamic> rsvpJson;
    if (data is Map<String, dynamic>) {
      if (data.containsKey('data')) {
        final inner = data['data'];
        if (inner == null) return null;
        rsvpJson = inner as Map<String, dynamic>;
      } else {
        rsvpJson = data;
      }
    } else {
      return null;
    }
    return EventRsvpModel.fromJson(rsvpJson);
  }
}
