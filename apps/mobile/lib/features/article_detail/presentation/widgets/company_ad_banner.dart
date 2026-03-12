import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';

import '../../../../core/network/api_client.dart';
import '../../../feed/domain/entities/feed_item.dart';
import '../../../feed/presentation/widgets/sponsored_feed_card.dart';

/// Private model parsed from the GET /ads/company/active response.
class _AdData {
  final String id;
  final String advertiserName;
  final String? advertiserLogoUrl;
  final String title;
  final String? contentHe;
  final String? imageUrl;
  final String? ctaUrl;
  final String? ctaLabelHe;

  const _AdData({
    required this.id,
    required this.advertiserName,
    this.advertiserLogoUrl,
    required this.title,
    this.contentHe,
    this.imageUrl,
    this.ctaUrl,
    this.ctaLabelHe,
  });

  factory _AdData.fromJson(Map<String, dynamic> json) {
    final advertiser = json['advertiser'] as Map<String, dynamic>? ?? {};
    return _AdData(
      id: json['id'] as String,
      advertiserName: advertiser['name'] as String? ?? '',
      advertiserLogoUrl: advertiser['logoUrl'] as String?,
      title: json['title'] as String? ?? '',
      contentHe: json['contentHe'] as String?,
      imageUrl: json['imageUrl'] as String?,
      ctaUrl: json['ctaUrl'] as String?,
      ctaLabelHe: json['ctaLabelHe'] as String?,
    );
  }
}

/// Fetches the first active company ad and displays it as a [SponsoredFeedCard]
/// inline within the article detail page.
///
/// Calls GET /api/v1/ads/company/active?type=article_banner and, on success,
/// records an impression via POST /api/v1/ads/company/impression.
/// Returns [SizedBox.shrink] when no ad is available or on any error.
class CompanyAdBanner extends StatefulWidget {
  const CompanyAdBanner({super.key});

  @override
  State<CompanyAdBanner> createState() => _CompanyAdBannerState();
}

class _CompanyAdBannerState extends State<CompanyAdBanner> {
  _AdData? _ad;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchAd();
  }

  Future<void> _fetchAd() async {
    try {
      final apiClient = GetIt.I<ApiClient>();
      final response = await apiClient.get<List<dynamic>>(
        '/ads/company/active',
        queryParameters: {'type': 'article_banner'},
      );
      if (!mounted) return;

      final list = response.data;
      if (list == null || list.isEmpty) {
        setState(() {
          _ad = null;
          _isLoading = false;
        });
        return;
      }

      final adData = _AdData.fromJson(list.first as Map<String, dynamic>);

      setState(() {
        _ad = adData;
        _isLoading = false;
      });

      // Record impression — fire-and-forget, failures are silently ignored.
      _recordImpression(apiClient, adData.id);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _ad = null;
        _isLoading = false;
      });
    }
  }

  Future<void> _recordImpression(ApiClient apiClient, String adId) async {
    try {
      await apiClient.post<void>(
        '/ads/company/impression',
        data: {'adId': adId},
      );
    } catch (_) {
      // Impression failures are non-fatal; ignore silently.
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading || _ad == null) {
      return const SizedBox.shrink();
    }

    final companyAd = FeedCompanyAdContent(
      adId: _ad!.id,
      advertiserName: _ad!.advertiserName,
      advertiserLogoUrl: _ad!.advertiserLogoUrl,
      title: _ad!.title,
      contentHe: _ad!.contentHe,
      imageUrl: _ad!.imageUrl,
      ctaUrl: _ad!.ctaUrl,
      ctaLabelHe: _ad!.ctaLabelHe,
    );

    return SponsoredFeedCard(companyAd: companyAd);
  }
}
