import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';

/// Introduction page for the Candidate Matcher (VAA) feature.
///
/// Shows a hero illustration, title "מי המועמד שלך?", explanation text,
/// and a Start button that navigates to the questions page.
class MatcherIntroPage extends StatelessWidget {
  final String? electionId;

  const MatcherIntroPage({super.key, this.electionId});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.colors.surface,
        appBar: AppBar(
          backgroundColor: context.colors.surface,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_forward, color: context.colors.textPrimary),
            onPressed: () => context.pop(),
          ),
          centerTitle: true,
          title: Text(
            'matcher_title'.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: context.colors.textPrimary,
            ),
          ),
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsetsDirectional.symmetric(horizontal: 24),
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      children: [
                        const SizedBox(height: 24),
                        // Hero illustration
                        _buildHeroIllustration(context),
                        const SizedBox(height: 32),
                        // Title
                        Text(
                          'matcher_find_your_candidate'.tr(),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            color: context.colors.textPrimary,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Description
                        Text(
                          'matcher_intro_description'.tr(),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 15,
                            color: context.colors.textSecondary,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 28),
                        // Features list
                        _buildFeaturesList(context),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
                // Start button
                _buildStartButton(context),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroIllustration(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 200,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.likudBlue.withValues(alpha: 0.1),
            AppColors.likudBlue.withValues(alpha: 0.02),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 90,
            height: 90,
            decoration: BoxDecoration(
              color: AppColors.likudBlue.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.how_to_vote_outlined,
              size: 48,
              color: AppColors.likudBlue,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsetsDirectional.symmetric(
              horizontal: 16,
              vertical: 6,
            ),
            decoration: BoxDecoration(
              color: AppColors.likudBlue,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              'matcher_badge_label'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturesList(BuildContext context) {
    return Column(
      children: [
        _buildFeatureRow(
          context,
          icon: Icons.check_circle_outline,
          textKey: 'matcher_feature_anonymous',
        ),
        const SizedBox(height: 10),
        _buildFeatureRow(
          context,
          icon: Icons.bar_chart_outlined,
          textKey: 'matcher_feature_precise',
        ),
        const SizedBox(height: 10),
        _buildFeatureRow(
          context,
          icon: Icons.share_outlined,
          textKey: 'matcher_feature_share',
        ),
        const SizedBox(height: 10),
        _buildFeatureRow(
          context,
          icon: Icons.compare_arrows,
          textKey: 'matcher_feature_compare',
        ),
      ],
    );
  }

  Widget _buildFeatureRow(
    BuildContext context, {
    required IconData icon,
    required String textKey,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: AppColors.success,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            textKey.tr(),
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 14,
              color: context.colors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStartButton(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 52,
          child: ElevatedButton(
            onPressed: () {
              final id = electionId ?? 'active';
              context.push('/primaries/matcher/questions/$id');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.likudBlue,
              foregroundColor: AppColors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              elevation: 0,
            ),
            child: Text(
              'matcher_start'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
