import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/theme_context.dart';
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
    });
    context.read<CandidatesBloc>().add(
      LoadCandidates(electionId: election.id),
    );
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
          'candidates_title'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
          ),
        ),
      ),
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
