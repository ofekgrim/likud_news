import 'package:flutter/material.dart';
import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:get_it/get_it.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/network/api_client.dart';
import '../../domain/entities/feed_item.dart';

/// Card widget for displaying a sponsored company ad in the feed.
/// Shows "ממומן" (Sponsored) badge per Israeli advertising law.
/// Records an impression on first render and a click on tap.
class SponsoredFeedCard extends StatefulWidget {
  final FeedCompanyAdContent companyAd;

  const SponsoredFeedCard({super.key, required this.companyAd});

  @override
  State<SponsoredFeedCard> createState() => _SponsoredFeedCardState();
}

class _SponsoredFeedCardState extends State<SponsoredFeedCard> {
  @override
  void initState() {
    super.initState();
    // Fire impression on first render — fire-and-forget, no UI impact on failure
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _recordImpression();
    });
  }

  Future<void> _recordImpression() async {
    try {
      final apiClient = GetIt.I<ApiClient>();
      await apiClient.post('/ads/company/impression',
          data: {'placementId': widget.companyAd.adId});
    } catch (_) {
      // Ignore — impression tracking should never crash the UI
    }
  }

  Future<void> _recordClick() async {
    try {
      final apiClient = GetIt.I<ApiClient>();
      await apiClient.post('/ads/company/click',
          data: {'placementId': widget.companyAd.adId});
    } catch (_) {}
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _onTap() async {
    _recordClick();
    if (widget.companyAd.ctaUrl != null) {
      await _launchUrl(widget.companyAd.ctaUrl!);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: const Color(0xFF0099DB).withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: widget.companyAd.ctaUrl != null ? _onTap : null,
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(12, 10, 12, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: advertiser info + sponsored badge
              Row(
                children: [
                  if (widget.companyAd.advertiserLogoUrl != null) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: Image.network(
                        widget.companyAd.advertiserLogoUrl!,
                        width: 20,
                        height: 20,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) =>
                            const SizedBox(width: 20, height: 20),
                      ),
                    ),
                    const SizedBox(width: 6),
                  ],
                  Text(
                    widget.companyAd.advertiserName,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                  ),
                  const Spacer(),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'sponsored'.tr(),
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: Colors.grey[600],
                            fontSize: 10,
                          ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Ad image
              if (widget.companyAd.imageUrl != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    widget.companyAd.imageUrl!,
                    width: double.infinity,
                    height: 150,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                  ),
                ),
                const SizedBox(height: 8),
              ],

              // Title
              Text(
                widget.companyAd.title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                textDirection: TextDirection.rtl,
              ),

              // Content
              if (widget.companyAd.contentHe != null &&
                  widget.companyAd.contentHe!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  widget.companyAd.contentHe!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[700],
                      ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  textDirection: TextDirection.rtl,
                ),
              ],

              // CTA button
              if (widget.companyAd.ctaUrl != null) ...[
                const SizedBox(height: 10),
                Align(
                  alignment: AlignmentDirectional.centerEnd,
                  child: OutlinedButton(
                    onPressed: _onTap,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF0099DB),
                      side: const BorderSide(color: Color(0xFF0099DB)),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 6),
                    ),
                    child: Text(
                      widget.companyAd.ctaLabelHe ?? 'ad_cta_label'.tr(),
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
