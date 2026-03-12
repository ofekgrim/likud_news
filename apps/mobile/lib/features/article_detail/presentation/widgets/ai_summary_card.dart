import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/network/api_client.dart';

/// Model for the AI-generated article summary.
class _AiSummary {
  final String summaryHe;
  final List<String> keyPointsHe;
  final String? politicalAngleHe;

  const _AiSummary({
    required this.summaryHe,
    required this.keyPointsHe,
    this.politicalAngleHe,
  });

  factory _AiSummary.fromJson(Map<String, dynamic> json) {
    return _AiSummary(
      summaryHe: json['summaryHe'] as String? ?? '',
      keyPointsHe:
          (json['keyPointsHe'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      politicalAngleHe: json['politicalAngleHe'] as String?,
    );
  }
}

/// AI Summary card displayed above the article body.
///
/// Fetches the summary from GET /api/v1/ai/summarize/:articleId.
/// Shows a collapsed 3-sentence summary with expand/collapse toggle.
/// When expanded, shows key points and political angle.
/// Gracefully hides itself if no summary is available.
class AiSummaryCard extends StatefulWidget {
  final String articleId;
  final VoidCallback? onReadFullArticle;

  const AiSummaryCard({
    super.key,
    required this.articleId,
    this.onReadFullArticle,
  });

  @override
  State<AiSummaryCard> createState() => _AiSummaryCardState();
}

class _AiSummaryCardState extends State<AiSummaryCard>
    with SingleTickerProviderStateMixin {
  _AiSummary? _summary;
  bool _isLoading = true;
  bool _hasError = false;
  bool _isExpanded = false;

  late final AnimationController _expandController;
  late final Animation<double> _expandAnimation;

  @override
  void initState() {
    super.initState();
    _expandController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _expandAnimation = CurvedAnimation(
      parent: _expandController,
      curve: Curves.easeInOut,
    );
    _fetchSummary();
  }

  @override
  void dispose() {
    _expandController.dispose();
    super.dispose();
  }

  Future<void> _fetchSummary() async {
    try {
      final apiClient = GetIt.I<ApiClient>();
      final response = await apiClient.get<Map<String, dynamic>>(
        '/ai/summarize/${widget.articleId}',
      );
      if (!mounted) return;

      final data = response.data;
      if (data == null) {
        setState(() {
          _isLoading = false;
          _hasError = true;
        });
        return;
      }

      setState(() {
        _summary = _AiSummary.fromJson(data);
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _hasError = true;
      });
    }
  }

  void _toggleExpand() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _expandController.forward();
      } else {
        _expandController.reverse();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Don't show anything if there's an error or no summary
    if (_hasError || (!_isLoading && _summary == null)) {
      return const SizedBox.shrink();
    }

    if (_isLoading) {
      return _buildShimmer(context);
    }

    return const SizedBox.shrink();
  }

  Widget _buildShimmer(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 8),
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.cardSurface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.likudBlue.withValues(alpha: 0.15),
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title shimmer
            Container(
              width: 120,
              height: 14,
              decoration: BoxDecoration(
                color: AppColors.likudBlue.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: 12),
            // Line shimmers
            for (int i = 0; i < 3; i++) ...[
              Container(
                width: i == 2 ? 200 : double.infinity,
                height: 12,
                decoration: BoxDecoration(
                  color: context.colors.border.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              if (i < 2) const SizedBox(height: 8),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCard(BuildContext context) {
    final summary = _summary!;

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 8),
      child: Container(
        decoration: BoxDecoration(
          color: context.colors.cardSurface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppColors.likudBlue.withValues(alpha: 0.15),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.likudBlue.withValues(alpha: 0.06),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
              child: Row(
                children: [
                  Icon(
                    Icons.auto_awesome,
                    size: 16,
                    color: AppColors.likudBlue,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'ai_summary.title'.tr(),
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.likudBlue,
                    ),
                  ),
                ],
              ),
            ),

            // Summary text
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(16, 10, 16, 0),
              child: Text(
                summary.summaryHe,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  height: 1.6,
                  color: context.colors.textPrimary,
                ),
                maxLines: _isExpanded ? null : 3,
                overflow: _isExpanded ? null : TextOverflow.ellipsis,
              ),
            ),

            // Expanded content
            SizeTransition(
              sizeFactor: _expandAnimation,
              axisAlignment: -1.0,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Key points
                  if (summary.keyPointsHe.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsetsDirectional.fromSTEB(
                        16,
                        14,
                        16,
                        0,
                      ),
                      child: Text(
                        'ai_summary.key_points'.tr(),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: context.colors.textSecondary,
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsetsDirectional.fromSTEB(
                        16,
                        8,
                        16,
                        0,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: summary.keyPointsHe.map((point) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsetsDirectional.only(
                                    end: 8,
                                    top: 6,
                                  ),
                                  child: Container(
                                    width: 5,
                                    height: 5,
                                    decoration: BoxDecoration(
                                      color: AppColors.likudBlue,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: Text(
                                    point,
                                    style: TextStyle(
                                      fontFamily: 'Heebo',
                                      fontSize: 13,
                                      height: 1.5,
                                      color: context.colors.textPrimary,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],

                  // Political angle
                  if (summary.politicalAngleHe != null &&
                      summary.politicalAngleHe!.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsetsDirectional.fromSTEB(
                        16,
                        10,
                        16,
                        0,
                      ),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.warning.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AppColors.warning.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ai_summary.political_angle'.tr(),
                              style: TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppColors.warning,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              summary.politicalAngleHe!,
                              style: TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 12,
                                height: 1.5,
                                color: context.colors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Expand/Collapse toggle + Full article button
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 6, 8, 8),
              child: Row(
                children: [
                  // Expand/Collapse
                  TextButton.icon(
                    onPressed: _toggleExpand,
                    icon: Icon(
                      _isExpanded
                          ? Icons.keyboard_arrow_up
                          : Icons.keyboard_arrow_down,
                      size: 18,
                      color: AppColors.likudBlue,
                    ),
                    label: Text(
                      _isExpanded
                          ? 'ai_summary.collapse'.tr()
                          : 'ai_summary.expand'.tr(),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.likudBlue,
                      ),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsetsDirectional.fromSTEB(
                        8,
                        4,
                        12,
                        4,
                      ),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                  const Spacer(),
                  // Full article button
                  if (widget.onReadFullArticle != null)
                    TextButton(
                      onPressed: widget.onReadFullArticle,
                      child: Text(
                        'ai_summary.full_article'.tr(),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: context.colors.textSecondary,
                        ),
                      ),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsetsDirectional.fromSTEB(
                          12,
                          4,
                          12,
                          4,
                        ),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
