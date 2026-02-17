import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import '../../app/theme/app_colors.dart';
import 'ad_config.dart';

/// A self-contained native ad widget styled to match the app's design system.
///
/// Uses Google's [NativeTemplateStyle] with `TemplateType.medium` for a
/// content-card-like appearance. Intended for placement before related articles
/// in the article detail screen.
///
/// Handles its own lifecycle: loads the ad on init, shows a placeholder while
/// loading, collapses to [SizedBox.shrink] on error, and disposes the ad
/// object when removed from the tree.
class AdNativeWidget extends StatefulWidget {
  const AdNativeWidget({super.key});

  @override
  State<AdNativeWidget> createState() => _AdNativeWidgetState();
}

class _AdNativeWidgetState extends State<AdNativeWidget> {
  NativeAd? _nativeAd;
  bool _isLoaded = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _loadAd();
  }

  void _loadAd() {
    _nativeAd = NativeAd(
      adUnitId: AdConfig.nativeAdUnitId,
      request: const AdRequest(),
      nativeTemplateStyle: NativeTemplateStyle(
        templateType: TemplateType.medium,
        mainBackgroundColor: AppColors.white,
        callToActionTextStyle: NativeTemplateTextStyle(
          backgroundColor: AppColors.likudBlue,
          textColor: AppColors.white,
          style: NativeTemplateFontStyle.bold,
          size: 14,
        ),
        primaryTextStyle: NativeTemplateTextStyle(
          textColor: AppColors.textPrimary,
          style: NativeTemplateFontStyle.bold,
          size: 16,
        ),
        secondaryTextStyle: NativeTemplateTextStyle(
          textColor: AppColors.textSecondary,
          style: NativeTemplateFontStyle.normal,
          size: 14,
        ),
      ),
      listener: NativeAdListener(
        onAdLoaded: (ad) {
          if (mounted) {
            setState(() {
              _isLoaded = true;
            });
          }
        },
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          if (mounted) {
            setState(() {
              _hasError = true;
            });
          }
        },
      ),
    )..load();
  }

  @override
  void dispose() {
    _nativeAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // "Sponsored content" label in Hebrew
          Padding(
            padding: const EdgeInsetsDirectional.only(
              start: 12,
              top: 8,
            ),
            child: Text(
              'תוכן ממומן',
              style: TextStyle(
                color: AppColors.textTertiary,
                fontSize: 10,
                fontFamily: 'Heebo',
              ),
            ),
          ),
          if (_isLoaded && _nativeAd != null)
            ConstrainedBox(
              constraints: const BoxConstraints(
                minHeight: 200,
                maxHeight: 350,
              ),
              child: AdWidget(ad: _nativeAd!),
            )
          else
            // Subtle loading placeholder
            Container(
              constraints: const BoxConstraints(
                minHeight: 200,
                maxHeight: 350,
              ),
              height: 250,
              decoration: BoxDecoration(
                color: AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(8),
              ),
              margin: const EdgeInsets.all(8),
              child: const Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.textTertiary,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
