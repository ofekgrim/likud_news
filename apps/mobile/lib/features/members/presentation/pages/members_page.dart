import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/member.dart';
import '../bloc/members_bloc.dart';
import '../widgets/member_card.dart';
import 'member_detail_page.dart';

/// Members directory page.
///
/// Displays a searchable grid of all Likud members. The search
/// bar at the top filters members locally by name or title.
class MembersPage extends StatefulWidget {
  const MembersPage({super.key});

  @override
  State<MembersPage> createState() => _MembersPageState();
}

class _MembersPageState extends State<MembersPage> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    context.read<MembersBloc>().add(const LoadMembers());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Member> _filterMembers(List<Member> members) {
    if (_searchQuery.isEmpty) return members;
    final query = _searchQuery.toLowerCase();
    return members.where((member) {
      return member.name.toLowerCase().contains(query) ||
          (member.nameEn?.toLowerCase().contains(query) ?? false) ||
          (member.title?.toLowerCase().contains(query) ?? false);
    }).toList();
  }

  void _navigateToDetail(BuildContext context, Member member) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: context.read<MembersBloc>(),
          child: MemberDetailPage(memberId: member.id),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'members'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: Column(
        children: [
          // Search bar.
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              textDirection: TextDirection.rtl,
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
              decoration: InputDecoration(
                hintText: 'search_members_hint'.tr(),
                hintStyle: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: AppColors.textTertiary,
                ),
                prefixIcon: const Icon(
                  Icons.search,
                  color: AppColors.textTertiary,
                ),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(
                          Icons.clear,
                          color: AppColors.textTertiary,
                        ),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppColors.surfaceMedium,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
              ),
            ),
          ),
          // Members grid.
          Expanded(
            child: BlocBuilder<MembersBloc, MembersState>(
              builder: (context, state) {
                if (state is MembersLoading || state is MembersInitial) {
                  return _buildLoadingState();
                }

                if (state is MembersError) {
                  return ErrorView(
                    message: state.message,
                    onRetry: () =>
                        context.read<MembersBloc>().add(const LoadMembers()),
                  );
                }

                if (state is MembersLoaded) {
                  return _buildLoadedState(context, state);
                }

                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: 6,
      physics: const NeverScrollableScrollPhysics(),
      itemBuilder: (_, __) => Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(16),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ShimmerLoading(width: 72, height: 72, borderRadius: 36),
            SizedBox(height: 10),
            ShimmerLoading(width: 80, height: 14, borderRadius: 4),
            SizedBox(height: 6),
            ShimmerLoading(width: 60, height: 10, borderRadius: 4),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadedState(BuildContext context, MembersLoaded state) {
    final filtered = _filterMembers(state.members);

    if (filtered.isEmpty) {
      return Center(
        child: Text(
          _searchQuery.isNotEmpty
              ? 'no_results'.tr()
              : 'no_members'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final member = filtered[index];
        return MemberCard(
          member: member,
          onTap: () => _navigateToDetail(context, member),
        );
      },
    );
  }
}
