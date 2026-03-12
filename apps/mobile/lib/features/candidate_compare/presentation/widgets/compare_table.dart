import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../domain/entities/compare_result.dart';

/// Side-by-side comparison table for candidates.
///
/// Uses two synchronized scroll views so both columns scroll together.
/// Sticky headers show candidate photos and names at the top.
class CompareTable extends StatefulWidget {
  final CompareResult result;

  const CompareTable({super.key, required this.result});

  @override
  State<CompareTable> createState() => _CompareTableState();
}

class _CompareTableState extends State<CompareTable> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final candidates = widget.result.candidates;
    if (candidates.length < 2) return const SizedBox.shrink();

    return Column(
      children: [
        // Sticky header with candidate photos and names.
        _buildStickyHeader(context, candidates),
        const Divider(height: 1),
        // Scrollable comparison rows.
        Expanded(
          child: SingleChildScrollView(
            controller: _scrollController,
            padding: EdgeInsetsDirectional.only(
              bottom: MediaQuery.of(context).padding.bottom + 100,
            ),
            child: Column(
              children: [
                _buildCompareRow(
                  context,
                  label: 'candidate_position'.tr(),
                  icon: Icons.work_outline,
                  values: candidates
                      .map((c) => c.position ?? '-')
                      .toList(),
                ),
                _buildCompareRow(
                  context,
                  label: 'district'.tr(),
                  icon: Icons.location_on_outlined,
                  values: candidates
                      .map((c) => c.district ?? '-')
                      .toList(),
                ),
                _buildCompareRow(
                  context,
                  label: 'candidate_endorsements'.tr(),
                  icon: Icons.thumb_up_outlined,
                  values: candidates
                      .map((c) => '${c.endorsementCount}')
                      .toList(),
                  highlightHigher: true,
                ),
                _buildCompareRow(
                  context,
                  label: 'candidate_bio'.tr(),
                  icon: Icons.person_outline,
                  values: candidates
                      .map((c) => c.bio ?? '-')
                      .toList(),
                  isBio: true,
                ),
                // Quiz position rows.
                if (widget.result.positionComparison.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsetsDirectional.fromSTEB(16, 20, 16, 8),
                    child: Row(
                      textDirection: TextDirection.rtl,
                      children: [
                        Icon(
                          Icons.quiz_outlined,
                          size: 18,
                          color: AppColors.likudBlue,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'compare_positions'.tr(),
                          textDirection: TextDirection.rtl,
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: context.colors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ...widget.result.positionComparison.entries.map(
                    (entry) => _buildPositionRow(
                      context,
                      category: entry.key,
                      scores: entry.value,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStickyHeader(
    BuildContext context,
    List<ComparedCandidate> candidates,
  ) {
    return Container(
      color: context.colors.cardSurface,
      padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 12),
      child: Row(
        textDirection: TextDirection.rtl,
        children: [
          for (int i = 0; i < candidates.length; i++) ...[
            if (i > 0) const SizedBox(width: 12),
            Expanded(
              child: _buildCandidateHeader(context, candidates[i]),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCandidateHeader(
    BuildContext context,
    ComparedCandidate candidate,
  ) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Circular photo.
        ClipOval(
          child: candidate.photoUrl != null && candidate.photoUrl!.isNotEmpty
              ? AppCachedImage(
                  imageUrl: candidate.photoUrl!,
                  width: 64,
                  height: 64,
                  fit: BoxFit.cover,
                )
              : Container(
                  width: 64,
                  height: 64,
                  color: context.colors.surfaceMedium,
                  child: Icon(
                    Icons.person,
                    color: context.colors.textTertiary,
                    size: 32,
                  ),
                ),
        ),
        const SizedBox(height: 8),
        // Name.
        Text(
          candidate.fullName,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          textDirection: TextDirection.rtl,
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildCompareRow(
    BuildContext context, {
    required String label,
    required IconData icon,
    required List<String> values,
    bool highlightHigher = false,
    bool isBio = false,
  }) {
    // Determine which candidate has the higher numeric value for highlighting.
    int? higherIndex;
    if (highlightHigher && values.length == 2) {
      final a = int.tryParse(values[0]);
      final b = int.tryParse(values[1]);
      if (a != null && b != null && a != b) {
        higherIndex = a > b ? 0 : 1;
      }
    }

    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: context.colors.cardSurface,
            width: 1,
          ),
        ),
      ),
      padding: const EdgeInsetsDirectional.fromSTEB(16, 12, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Row label.
          Row(
            textDirection: TextDirection.rtl,
            children: [
              Icon(icon, size: 16, color: context.colors.textTertiary),
              const SizedBox(width: 6),
              Text(
                label,
                textDirection: TextDirection.rtl,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: context.colors.textTertiary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Values side by side.
          Row(
            textDirection: TextDirection.rtl,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (int i = 0; i < values.length; i++) ...[
                if (i > 0) const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: higherIndex == i
                          ? AppColors.likudLightBlue
                          : context.colors.surfaceMedium,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      values[i],
                      textDirection: TextDirection.rtl,
                      maxLines: isBio ? 6 : 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: isBio ? 12 : 14,
                        fontWeight: higherIndex == i
                            ? FontWeight.w700
                            : FontWeight.w400,
                        color: higherIndex == i
                            ? AppColors.likudBlue
                            : context.colors.textPrimary,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPositionRow(
    BuildContext context, {
    required String category,
    required List<double> scores,
  }) {
    // Find the higher score for highlighting.
    int? higherIndex;
    if (scores.length == 2 && scores[0] != scores[1]) {
      higherIndex = scores[0] > scores[1] ? 0 : 1;
    }

    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: context.colors.cardSurface,
            width: 1,
          ),
        ),
      ),
      padding: const EdgeInsetsDirectional.fromSTEB(16, 10, 16, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            category,
            textDirection: TextDirection.rtl,
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: context.colors.textTertiary,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            textDirection: TextDirection.rtl,
            children: [
              for (int i = 0; i < scores.length; i++) ...[
                if (i > 0) const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    children: [
                      // Score bar.
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: scores[i].clamp(0.0, 1.0),
                          backgroundColor: context.colors.surfaceMedium,
                          color: higherIndex == i
                              ? AppColors.likudBlue
                              : context.colors.textTertiary,
                          minHeight: 8,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${(scores[i] * 100).round()}%',
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 12,
                          fontWeight: higherIndex == i
                              ? FontWeight.w700
                              : FontWeight.w400,
                          color: higherIndex == i
                              ? AppColors.likudBlue
                              : context.colors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
