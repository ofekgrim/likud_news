/// Content types that can be shared via the sharing module.
enum ShareContentType {
  article,
  candidate,
  quizResult,
  event,
  poll;

  /// Converts to the backend API string value.
  String toApiValue() {
    switch (this) {
      case ShareContentType.article:
        return 'article';
      case ShareContentType.candidate:
        return 'candidate';
      case ShareContentType.quizResult:
        return 'quiz_result';
      case ShareContentType.event:
        return 'event';
      case ShareContentType.poll:
        return 'poll';
    }
  }

  /// Parses a backend API string value to enum.
  static ShareContentType fromApiValue(String value) {
    switch (value) {
      case 'article':
        return ShareContentType.article;
      case 'candidate':
        return ShareContentType.candidate;
      case 'quiz_result':
        return ShareContentType.quizResult;
      case 'event':
        return ShareContentType.event;
      case 'poll':
        return ShareContentType.poll;
      default:
        return ShareContentType.article;
    }
  }
}

/// Represents a share link returned from the backend sharing module.
class ShareLink {
  final String id;
  final String shortCode;
  final ShareContentType contentType;
  final String contentId;
  final String? ogTitle;
  final String? ogDescription;
  final String? ogImageUrl;
  final String fullUrl;

  const ShareLink({
    required this.id,
    required this.shortCode,
    required this.contentType,
    required this.contentId,
    this.ogTitle,
    this.ogDescription,
    this.ogImageUrl,
    required this.fullUrl,
  });

  factory ShareLink.fromJson(Map<String, dynamic> json, String baseUrl) {
    final shortCode = json['shortCode'] as String;
    // Build the full OG URL so WhatsApp can fetch the preview
    final ogBaseUrl = baseUrl.replaceAll('/api/v1', '');
    return ShareLink(
      id: json['id'] as String,
      shortCode: shortCode,
      contentType:
          ShareContentType.fromApiValue(json['contentType'] as String),
      contentId: json['contentId'] as String,
      ogTitle: json['ogTitle'] as String?,
      ogDescription: json['ogDescription'] as String?,
      ogImageUrl: json['ogImageUrl'] as String?,
      fullUrl: '$ogBaseUrl/api/v1/sharing/og/$shortCode',
    );
  }
}
