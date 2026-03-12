import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../domain/entities/subscription_info.dart';
import '../bloc/premium_bloc.dart';
import '../bloc/premium_event.dart';
import '../bloc/premium_state.dart';
import '../widgets/benefit_card.dart';
import '../widgets/pricing_card.dart';
import '../widgets/vip_badge.dart';

/// Full-screen Premium / VIP subscription page.
///
/// Shows:
/// - Hero section with VIP branding
/// - Benefits list (locked/unlocked based on subscription status)
/// - Pricing cards (monthly / annual)
/// - Subscribe buttons (placeholder for RevenueCat native integration)
/// - Current subscription status (if subscribed)
/// - Cancel button (if subscribed)
class PremiumPage extends StatefulWidget {
  const PremiumPage({super.key});

  @override
  State<PremiumPage> createState() => _PremiumPageState();
}

class _PremiumPageState extends State<PremiumPage> {
  @override
  void initState() {
    super.initState();
    context.read<PremiumBloc>().add(const LoadSubscription());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: Text('premium.title'.tr()),
          centerTitle: true,
        ),
        body: BlocBuilder<PremiumBloc, PremiumState>(
          builder: (context, state) {
            if (state is PremiumLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (state is PremiumError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 48,
                      color: theme.colorScheme.error,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      state.message,
                      style: theme.textTheme.bodyLarge,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context
                          .read<PremiumBloc>()
                          .add(const LoadSubscription()),
                      child: Text('retry'.tr()),
                    ),
                  ],
                ),
              );
            }

            if (state is PremiumLoaded) {
              final isVip = state.subscriptionInfo?.isVip ?? false;

              return SingleChildScrollView(
                padding: const EdgeInsetsDirectional.symmetric(
                  horizontal: 20,
                  vertical: 16,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Hero section
                    _buildHeroSection(context, isVip),
                    const SizedBox(height: 28),

                    // Current subscription status (if subscribed)
                    if (isVip && state.subscriptionInfo != null)
                      _buildSubscriptionStatus(context, state.subscriptionInfo!),

                    // Benefits list
                    _buildBenefitsSection(context, state, isVip),
                    const SizedBox(height: 28),

                    // Pricing cards (only if not subscribed)
                    if (!isVip) ...[
                      _buildPricingSection(context),
                      const SizedBox(height: 28),
                    ],

                    // Cancel button (if subscribed)
                    if (isVip) _buildCancelSection(context),

                    const SizedBox(height: 40),
                  ],
                ),
              );
            }

            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildHeroSection(BuildContext context, bool isVip) {
    final theme = Theme.of(context);
    final primaryColor = const Color(0xFF0099DB);

    return Container(
      padding: const EdgeInsetsDirectional.all(28),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isVip
              ? [const Color(0xFFFFD700), const Color(0xFFFFA500)]
              : [primaryColor, primaryColor.withValues(alpha: 0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (isVip ? const Color(0xFFFFD700) : primaryColor)
                .withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          if (isVip)
            const VipBadge(size: 36)
          else
            Icon(
              Icons.workspace_premium,
              size: 56,
              color: Colors.white.withValues(alpha: 0.9),
            ),
          const SizedBox(height: 16),
          Text(
            'premium.title'.tr(),
            style: theme.textTheme.headlineSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'premium.subtitle'.tr(),
            style: theme.textTheme.bodyLarge?.copyWith(
              color: Colors.white.withValues(alpha: 0.85),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubscriptionStatus(
    BuildContext context,
    SubscriptionInfo info,
  ) {
    final theme = Theme.of(context);
    final isCancelled = info.status == SubscriptionStatus.cancelled;

    return Container(
      margin: const EdgeInsetsDirectional.only(bottom: 24),
      padding: const EdgeInsetsDirectional.all(16),
      decoration: BoxDecoration(
        color: isCancelled
            ? theme.colorScheme.error.withValues(alpha: 0.08)
            : const Color(0xFF4CAF50).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCancelled
              ? theme.colorScheme.error.withValues(alpha: 0.3)
              : const Color(0xFF4CAF50).withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        textDirection: TextDirection.rtl,
        children: [
          Icon(
            isCancelled ? Icons.cancel_outlined : Icons.check_circle,
            color: isCancelled
                ? theme.colorScheme.error
                : const Color(0xFF4CAF50),
            size: 28,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isCancelled
                      ? 'premium.cancelled'.tr()
                      : 'premium.active'.tr(),
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: isCancelled
                        ? theme.colorScheme.error
                        : const Color(0xFF4CAF50),
                  ),
                ),
                if (info.expiresAt != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    '${'premium.expires'.tr()}: ${DateFormat('dd/MM/yyyy').format(info.expiresAt!)}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBenefitsSection(
    BuildContext context,
    PremiumLoaded state,
    bool isVip,
  ) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isVip ? 'premium.active'.tr() : 'premium.subtitle'.tr(),
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 16),
        ...state.benefits.map(
          (benefit) => BenefitCard(
            benefit: benefit,
            isUnlocked: isVip,
          ),
        ),
      ],
    );
  }

  Widget _buildPricingSection(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'premium.subscribe'.tr(),
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 16),
        // Annual plan (recommended)
        PricingCard(
          isAnnual: true,
          isSelected: true,
          onSubscribe: () {
            // Placeholder: RevenueCat integration requires native setup
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'RevenueCat integration requires native setup',
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 16),
        // Monthly plan
        PricingCard(
          isAnnual: false,
          isSelected: false,
          onSubscribe: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'RevenueCat integration requires native setup',
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildCancelSection(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: TextButton.icon(
        onPressed: () => _showCancelConfirmation(context),
        icon: Icon(
          Icons.cancel_outlined,
          color: theme.colorScheme.error,
          size: 20,
        ),
        label: Text(
          'premium.cancel'.tr(),
          style: TextStyle(
            color: theme.colorScheme.error,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  void _showCancelConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('premium.cancel'.tr()),
        content: Text('profile_logout_confirm'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text('cancel'.tr()),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              context.read<PremiumBloc>().add(const CancelSubscription());
            },
            child: Text(
              'premium.cancel'.tr(),
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ),
        ],
      ),
    );
  }
}
