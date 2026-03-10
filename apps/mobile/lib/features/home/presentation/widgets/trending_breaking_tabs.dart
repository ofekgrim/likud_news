import 'package:cached_network_image/cached_network_image.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/branded_placeholder.dart';
import '../../domain/entities/article.dart';

/// Tabbed section showing "הנקראים ביותר" and "מבזקים" as horizontal carousels.
///
/// The user can switch between tabs. Each tab shows a horizontal carousel
/// of article cards in the appropriate style.
class TrendingBreakingTabs extends StatefulWidget {
  final List<Article> trendingArticles;
  final List<Article> breakingArticles;
  final void Function(Article article) onArticleTap;

  const TrendingBreakingTabs({
    super.key,
    required this.trendingArticles,
    required this.breakingArticles,
    required this.onArticleTap,
  });

  @override
  State<TrendingBreakingTabs> createState() => _TrendingBreakingTabsState();
}

class _TrendingBreakingTabsState extends State<TrendingBreakingTabs> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    // Determine which tabs are available (hide empty tabs).
    final tabs = <_TabData>[];
    if (widget.trendingArticles.isNotEmpty) {
      tabs.add(
        _TabData(
          label: 'trending'.tr(),
          icon: Icons.trending_up,
          articles: widget.trendingArticles,
          isBreaking: false,
        ),
      );
    }
    if (widget.breakingArticles.isNotEmpty) {
      tabs.add(
        _TabData(
          label: 'breaking_tab'.tr(),
          icon: Icons.bolt,
          articles: widget.breakingArticles,
          isBreaking: true,
        ),
      );
    }

    if (tabs.isEmpty) return const SizedBox.shrink();

    // Clamp selected index in case data changed.
    if (_selectedIndex >= tabs.length) _selectedIndex = 0;

    final activeTab = tabs[_selectedIndex];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Tab bar
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 8),
          child: Row(
            children: [
              for (int i = 0; i < tabs.length; i++) ...[
                if (i > 0) const SizedBox(width: 4),
                _TabChip(
                  label: tabs[i].label,
                  icon: tabs[i].icon,
                  isSelected: _selectedIndex == i,
                  isBreaking: tabs[i].isBreaking,
                  onTap: () => setState(() => _selectedIndex = i),
                ),
              ],
            ],
          ),
        ),

        // Carousel
        SizedBox(
          height: 240,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: ListView.separated(
              key: ValueKey(_selectedIndex),
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 0),
              itemCount: activeTab.articles.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final article = activeTab.articles[index];
                if (activeTab.isBreaking) {
                  return _BreakingCard(
                    article: article,
                    onTap: () => widget.onArticleTap(article),
                  );
                }
                return _TrendingCard(
                  article: article,
                  onTap: () => widget.onArticleTap(article),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _TabData {
  final String label;
  final IconData icon;
  final List<Article> articles;
  final bool isBreaking;

  const _TabData({
    required this.label,
    required this.icon,
    required this.articles,
    required this.isBreaking,
  });
}

// ---------------------------------------------------------------------------
// Tab chip
// ---------------------------------------------------------------------------

class _TabChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final bool isBreaking;
  final VoidCallback onTap;

  const _TabChip({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.isBreaking,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor = isBreaking
        ? AppColors.breakingRed
        : AppColors.likudBlue;
    final bgColor = isSelected
        ? activeColor.withValues(alpha: 0.1)
        : Colors.transparent;
    final fgColor = isSelected ? activeColor : context.colors.textTertiary;

    return Semantics(
      button: true,
      selected: isSelected,
      label: label,
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(20),
            border: isSelected
                ? Border.all(color: activeColor.withValues(alpha: 0.3))
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: fgColor),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: fgColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Trending card (same as existing TrendingCarousel card)
// ---------------------------------------------------------------------------

class _TrendingCard extends StatelessWidget {
  final Article article;
  final VoidCallback onTap;

  const _TrendingCard({required this.article, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: article.title,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 220,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: context.colors.cardSurface,
            boxShadow: [
              BoxShadow(
                color: context.colors.shadow,
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image
              SizedBox(
                height: 100,
                width: double.infinity,
                child: article.heroImageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: article.heroImageUrl!,
                        fit: BoxFit.cover,
                        placeholder: (_, __) =>
                            const BrandedPlaceholder(iconSize: 32),
                        errorWidget: (_, __, ___) =>
                            const BrandedPlaceholder(iconSize: 32),
                      )
                    : const BrandedPlaceholder(iconSize: 32),
              ),
              // Content
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (article.categoryName != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: _parseCategoryColor(
                                  article.categoryColor,
                                ),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                article.categoryName!,
                                style: const TextStyle(
                                  fontFamily: 'Heebo',
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          const Spacer(),
                          Icon(
                            Icons.visibility_outlined,
                            size: 12,
                            color: context.colors.textTertiary,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            _formatViewCount(article.viewCount),
                            style: TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 10,
                              color: context.colors.textTertiary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              article.title,
                              maxLines: _articleSnippet(article) != null
                                  ? 2
                                  : 20,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: context.colors.textPrimary,
                                height: 1.3,
                              ),
                            ),
                            if (_articleSnippet(article) != null) ...[
                              const SizedBox(height: 2),
                              Expanded(
                                child: Text(
                                  _articleSnippet(article)!,
                                  maxLines: 20,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontFamily: 'Heebo',
                                    fontSize: 11,
                                    color: context.colors.textSecondary,
                                    height: 1.3,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String? _articleSnippet(Article a) {
    if (a.content != null && a.content!.isNotEmpty)
      return a.content!
          .replaceAll(RegExp(r'<[^>]*>'), '')
          .replaceAll(RegExp(r'&\w+;'), ' ')
          .trim();
    return null;
  }

  Color _parseCategoryColor(String? hex) {
    if (hex == null || hex.isEmpty) return AppColors.likudBlue;
    try {
      final colorHex = hex.replaceAll('#', '');
      return Color(int.parse('FF$colorHex', radix: 16));
    } catch (_) {
      return AppColors.likudBlue;
    }
  }

  String _formatViewCount(int count) {
    if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }
}

// ---------------------------------------------------------------------------
// Breaking card (compact red-accented card for breaking news)
// ---------------------------------------------------------------------------

class _BreakingCard extends StatelessWidget {
  final Article article;
  final VoidCallback onTap;

  const _BreakingCard({required this.article, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: article.title,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 240,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: context.colors.cardSurface,
            border: Border.all(
              color: AppColors.breakingRed.withValues(alpha: 0.25),
            ),
            boxShadow: [
              BoxShadow(
                color: context.colors.shadow,
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero image
              SizedBox(
                height: 90,
                width: double.infinity,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    article.heroImageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: article.heroImageUrl!,
                            fit: BoxFit.cover,
                            placeholder: (_, __) =>
                                const BrandedPlaceholder(iconSize: 28),
                            errorWidget: (_, __, ___) =>
                                const BrandedPlaceholder(iconSize: 28),
                          )
                        : const BrandedPlaceholder(iconSize: 28),
                    // Breaking badge overlay
                    Positioned(
                      top: 6,
                      right: 6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.breakingRed,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.bolt,
                              size: 12,
                              color: Colors.white,
                            ),
                            const SizedBox(width: 2),
                            Text(
                              'breaking_badge'.tr(),
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Content
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              article.title,
                              maxLines: _breakingSnippet(article) != null
                                  ? 2
                                  : 20,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: context.colors.textPrimary,
                                height: 1.3,
                              ),
                            ),
                            if (_breakingSnippet(article) != null) ...[
                              const SizedBox(height: 2),
                              Expanded(
                                child: Text(
                                  _breakingSnippet(article)!,
                                  maxLines: 20,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontFamily: 'Heebo',
                                    fontSize: 11,
                                    color: context.colors.textSecondary,
                                    height: 1.3,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      if (article.publishedAt != null)
                        Text(
                          _formatTime(article.publishedAt!),
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 10,
                            color: context.colors.textTertiary,
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String? _breakingSnippet(Article a) {
    if (a.content != null && a.content!.isNotEmpty)
      return a.content!
          .replaceAll(RegExp(r'<[^>]*>'), '')
          .replaceAll(RegExp(r'&\w+;'), ' ')
          .trim();
    return null;
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);
    if (diff.inMinutes < 1) return 'now'.tr();
    if (diff.inMinutes < 60)
      return '${'ago'.tr()} ${diff.inMinutes} ${'minutes_short'.tr()}';
    if (diff.inHours < 24)
      return '${'ago'.tr()} ${diff.inHours} ${'hours_short'.tr()}';
    final d = dateTime.day.toString().padLeft(2, '0');
    final m = dateTime.month.toString().padLeft(2, '0');
    return '$d/$m';
  }
}
