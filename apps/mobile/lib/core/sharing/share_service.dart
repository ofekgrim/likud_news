import 'package:injectable/injectable.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../constants/api_constants.dart';
import '../network/api_client.dart';
import '../services/app_logger.dart';
import 'models/share_link.dart';

/// Core service for creating share links and sharing content to WhatsApp.
///
/// Uses the backend `POST /sharing/create-link` endpoint to generate
/// short links with OG metadata, then opens WhatsApp with the link or
/// falls back to the system share sheet.
@lazySingleton
class ShareService {
  final ApiClient _apiClient;

  ShareService(this._apiClient);

  /// Creates a share link on the backend.
  ///
  /// Returns a [ShareLink] with the short code and full OG URL.
  /// Throws on network or server errors.
  Future<ShareLink> createShareLink(
    ShareContentType type,
    String contentId, {
    String? title,
    String? description,
    String? imageUrl,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      '/sharing/create-link',
      data: {
        'contentType': type.toApiValue(),
        'contentId': contentId,
        if (title != null) 'ogTitle': title,
        if (description != null) 'ogDescription': description,
        if (imageUrl != null) 'ogImageUrl': imageUrl,
        'utmSource': 'whatsapp',
        'utmMedium': 'social',
      },
    );

    final data = response.data!['data'] as Map<String, dynamic>;
    return ShareLink.fromJson(data, ApiConstants.baseUrl);
  }

  /// Opens WhatsApp with the given text and optional URL.
  ///
  /// Falls back to the system share sheet if WhatsApp is not installed.
  Future<void> shareToWhatsApp(String text, {String? url}) async {
    final shareText = url != null ? '$text\n$url' : text;
    final encoded = Uri.encodeComponent(shareText);
    final whatsappUri = Uri.parse('https://wa.me/?text=$encoded');

    try {
      final launched = await launchUrl(
        whatsappUri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        // WhatsApp not installed — use system share sheet.
        await Share.share(shareText);
      }
    } catch (e) {
      AppLogger.instance.error('WhatsApp launch failed, using system share', e);
      await Share.share(shareText);
    }
  }

  /// Creates a share link on the backend and then shares to WhatsApp.
  ///
  /// [shareText] is the user-visible text prepended before the link.
  /// Returns the created [ShareLink].
  Future<ShareLink> shareContent(
    ShareContentType type,
    String contentId,
    String shareText, {
    String? title,
    String? description,
    String? imageUrl,
  }) async {
    final link = await createShareLink(
      type,
      contentId,
      title: title,
      description: description,
      imageUrl: imageUrl,
    );

    await shareToWhatsApp(shareText, url: link.fullUrl);
    return link;
  }
}
