import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/member.dart';
import '../bloc/members_bloc.dart';
import '../widgets/member_card.dart';

/// Members directory page.
///
/// Displays a searchable list of all Likud members using business card
/// style cards. The search bar at the top filters members locally by
/// name, title, or office.
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
          (member.title?.toLowerCase().contains(query) ?? false) ||
          (member.office?.toLowerCase().contains(query) ?? false);
    }).toList();
  }

  void _navigateToDetail(BuildContext context, Member member) {
    context.push('/member/${member.id}');
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'members'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
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
                hintStyle: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: context.colors.textTertiary,
                ),
                prefixIcon: Icon(
                  Icons.search,
                  color: context.colors.textTertiary,
                ),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: Icon(
                          Icons.clear,
                          color: context.colors.textTertiary,
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
            ),
          ),
          // Members list.
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
            const ShimmerLoading(width: 56, height: 56, borderRadius: 28),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  ShimmerLoading(width: 120, height: 16, borderRadius: 4),
                  SizedBox(height: 6),
                  ShimmerLoading(width: 90, height: 14, borderRadius: 4),
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

  Widget _buildLoadedState(BuildContext context, MembersLoaded state) {
    final filtered = _filterMembers(state.members);

    if (filtered.isEmpty) {
      return Center(
        child: Text(
          _searchQuery.isNotEmpty
              ? 'no_results'.tr()
              : 'no_members'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 14,
            color: context.colors.textSecondary,
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
      itemCount: filtered.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
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
