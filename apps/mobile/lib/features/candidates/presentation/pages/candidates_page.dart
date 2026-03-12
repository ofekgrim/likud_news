import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/candidate.dart';
import '../../domain/entities/election.dart';
import '../bloc/candidates_bloc.dart';
import '../widgets/candidate_card.dart';
import '../widgets/district_filter_bar.dart';

/// Candidates directory page.
///
/// Shows an election selector at the top (if multiple elections exist),
/// a horizontal district filter bar, and a vertically scrolling list
/// of candidate cards.
class CandidatesPage extends StatefulWidget {
  const CandidatesPage({super.key});

  @override
  State<CandidatesPage> createState() => _CandidatesPageState();
}

class _CandidatesPageState extends State<CandidatesPage> {
  List<Election> _elections = [];
  Election? _selectedElection;

  /// IDs of candidates selected for comparison.
  final Set<String> _selectedForCompare = {};

  /// Whether multi-select mode is active.
  bool _isSelectMode = false;

  @override
  void initState() {
    super.initState();
    context.read<CandidatesBloc>().add(const LoadElections());
  }

  /// Extracts unique non-null districts from a list of candidates.
  List<String> _extractDistricts(List<Candidate> candidates) {
    final districts = <String>{};
    for (final candidate in candidates) {
      if (candidate.district != null && candidate.district!.isNotEmpty) {
        districts.add(candidate.district!);
      }
    }
    final sorted = districts.toList()..sort();
    return sorted;
  }

  void _onElectionSelected(Election election) {
    setState(() {
      _selectedElection = election;
      _selectedForCompare.clear();
      _isSelectMode = false;
    });
    context.read<CandidatesBloc>().add(
      LoadCandidates(electionId: election.id),
    );
  }

  void _toggleSelectMode() {
    setState(() {
      _isSelectMode = !_isSelectMode;
      if (!_isSelectMode) {
        _selectedForCompare.clear();
      }
    });
  }

  void _toggleCandidateSelection(String candidateId) {
    setState(() {
      if (_selectedForCompare.contains(candidateId)) {
        _selectedForCompare.remove(candidateId);
      } else if (_selectedForCompare.length < 2) {
        _selectedForCompare.add(candidateId);
      }
    });
  }

  void _navigateToCompare(BuildContext context) {
    if (_selectedForCompare.length >= 2) {
      context.push(
        '/primaries/compare',
        extra: _selectedForCompare.toList(),
      );
    }
  }

  Future<void> _navigateToDetail(BuildContext context, Candidate candidate) async {
    await context.push('/candidate/${candidate.slug}');
    // Reload candidates when returning from detail to reflect endorsement changes.
    if (_selectedElection != null && mounted) {
      context.read<CandidatesBloc>().add(
        LoadCandidates(electionId: _selectedElection!.id),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          _isSelectMode
              ? 'select_candidates_to_compare'.tr()
              : 'candidates_title'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isSelectMode ? Icons.close : Icons.compare_arrows,
              color: _isSelectMode
                  ? AppColors.likudBlue
                  : context.colors.textPrimary,
            ),
            tooltip: 'compare_candidates'.tr(),
            onPressed: _toggleSelectMode,
          ),
        ],
      ),
      floatingActionButton: _isSelectMode && _selectedForCompare.length >= 2
          ? FloatingActionButton.extended(
              onPressed: () => _navigateToCompare(context),
              backgroundColor: AppColors.likudBlue,
              icon: const Icon(Icons.compare_arrows, color: Colors.white),
              label: Text(
                'compare_button'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      body: BlocConsumer<CandidatesBloc, CandidatesState>(
        // Ignore detail-page states (CandidateDetailLoaded, EndorsementUpdated)
        // so the list remains visible when user is on the detail page.
        buildWhen: (prev, curr) =>
            curr is CandidatesInitial ||
            curr is CandidatesLoading ||
            curr is CandidatesLoaded ||
            curr is CandidatesError ||
            curr is ElectionsLoaded,
        listener: (context, state) {
          if (state is ElectionsLoaded) {
            _elections = state.elections;
            if (_elections.isNotEmpty) {
              // Auto-select first election and load its candidates.
              _selectedElection = _elections.first;
              context.read<CandidatesBloc>().add(
                LoadCandidates(electionId: _selectedElection!.id),
              );
            }
          }
        },
        builder: (context, state) {
          if (state is CandidatesLoading && _elections.isEmpty) {
            return _buildLoadingState();
          }

          if (state is CandidatesError && _elections.isEmpty) {
            return ErrorView(
              message: state.message,
              onRetry: () => context
                  .read<CandidatesBloc>()
                  .add(const LoadElections()),
            );
          }

          return Column(
            children: [
              // Election selector (only if multiple elections).
              if (_elections.length > 1) _buildElectionSelector(),

              // District filter bar + candidates list.
              Expanded(
                child: _buildCandidatesContent(context, state),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildElectionSelector() {
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 4),
      child: DropdownButtonFormField<String>(
        initialValue: _selectedElection?.id,
        isExpanded: true,
        decoration: InputDecoration(
          filled: true,
          fillColor: context.colors.surfaceMedium,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
        ),
        style: TextStyle(
          fontFamily: 'Heebo',
          fontSize: 14,
          color: context.colors.textPrimary,
        ),
        items: _elections.map((election) {
          return DropdownMenuItem<String>(
            value: election.id,
            child: Text(
              election.title,
              textDirection: TextDirection.rtl,
            ),
          );
        }).toList(),
        onChanged: (value) {
          if (value != null) {
            final election = _elections.firstWhere((e) => e.id == value);
            _onElectionSelected(election);
          }
        },
      ),
    );
  }

  Widget _buildCandidatesContent(
    BuildContext context,
    CandidatesState state,
  ) {
    if (state is CandidatesLoading) {
      return _buildLoadingState();
    }

    if (state is CandidatesError) {
      return ErrorView(
        message: state.message,
        onRetry: () {
          if (_selectedElection != null) {
            context.read<CandidatesBloc>().add(
              LoadCandidates(electionId: _selectedElection!.id),
            );
          }
        },
      );
    }

    if (state is CandidatesLoaded) {
      return _buildLoadedState(context, state);
    }

    // ElectionsLoaded but no candidates yet — show empty.
    if (_elections.isEmpty) {
      return Center(
        child: Text(
          'candidates_no_elections'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 14,
            color: context.colors.textSecondary,
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildLoadedState(BuildContext context, CandidatesLoaded state) {
    final districts = _extractDistricts(state.candidates);
    final filtered = state.filteredCandidates;

    return Column(
      children: [
        // "How do primaries work?" guide button.
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 0),
          child: OutlinedButton.icon(
            onPressed: () => context.push('/primaries/guide'),
            icon: const Icon(Icons.school_outlined, size: 18),
            label: Text('primaries_guide.how_primaries_work'.tr()),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.likudBlue,
              side: const BorderSide(color: AppColors.likudBlue),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              textStyle: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),

        // District filter bar.
        if (districts.isNotEmpty) ...[
          const SizedBox(height: 8),
          DistrictFilterBar(
            districts: districts,
            selectedDistrict: state.selectedDistrict,
            onDistrictSelected: (district) {
              context.read<CandidatesBloc>().add(
                FilterByDistrict(district: district),
              );
            },
          ),
          const SizedBox(height: 8),
        ],

        // Candidates list.
        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Text(
                    'candidates_no_results'.tr(),
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 14,
                      color: context.colors.textSecondary,
                    ),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final candidate = filtered[index];
                    final isSelected =
                        _selectedForCompare.contains(candidate.id);
                    if (_isSelectMode) {
                      return _buildSelectableCard(
                        context,
                        candidate,
                        isSelected,
                      );
                    }
                    return CandidateCard(
                      candidate: candidate,
                      onTap: () => _navigateToDetail(context, candidate),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildSelectableCard(
    BuildContext context,
    Candidate candidate,
    bool isSelected,
  ) {
    final canSelect = _selectedForCompare.length < 2 || isSelected;
    return GestureDetector(
      onTap: canSelect
          ? () => _toggleCandidateSelection(candidate.id)
          : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: context.colors.cardSurface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppColors.likudBlue
                : Colors.transparent,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: context.colors.shadow,
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsetsDirectional.all(14),
          child: Row(
            textDirection: TextDirection.rtl,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Selection checkbox.
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.likudBlue
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.likudBlue
                        : context.colors.textTertiary,
                    width: 2,
                  ),
                ),
                child: isSelected
                    ? const Icon(
                        Icons.check,
                        size: 16,
                        color: Colors.white,
                      )
                    : null,
              ),
              const SizedBox(width: 10),
              // Circular photo.
              ClipOval(
                child: candidate.photoUrl != null &&
                        candidate.photoUrl!.isNotEmpty
                    ? AppCachedImage(
                        imageUrl: candidate.photoUrl!,
                        width: 60,
                        height: 60,
                        fit: BoxFit.cover,
                      )
                    : Container(
                        width: 60,
                        height: 60,
                        color: context.colors.surfaceMedium,
                        child: Icon(
                          Icons.person,
                          color: context.colors.textTertiary,
                          size: 30,
                        ),
                      ),
              ),
              const SizedBox(width: 14),
              // Info column.
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      candidate.fullName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textDirection: TextDirection.rtl,
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: context.colors.textPrimary,
                      ),
                    ),
                    if (candidate.district != null &&
                        candidate.district!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        candidate.district!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textDirection: TextDirection.rtl,
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 14,
                          color: context.colors.textSecondary,
                        ),
                      ),
                    ],
                    if (candidate.position != null &&
                        candidate.position!.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        candidate.position!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textDirection: TextDirection.rtl,
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 12,
                          color: context.colors.textTertiary,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Endorsement count badge.
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.likudLightBlue,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.thumb_up_outlined,
                      size: 14,
                      color: AppColors.likudBlue,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${candidate.endorsementCount}',
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.likudBlue,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 6,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, __) => Container(
        decoration: BoxDecoration(
          color: context.colors.cardSurface,
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(
          textDirection: TextDirection.rtl,
          children: [
            const ShimmerLoading(width: 60, height: 60, borderRadius: 30),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  ShimmerLoading(width: 130, height: 16, borderRadius: 4),
                  SizedBox(height: 6),
                  ShimmerLoading(width: 100, height: 14, borderRadius: 4),
                  SizedBox(height: 6),
                  ShimmerLoading(width: 70, height: 12, borderRadius: 4),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
