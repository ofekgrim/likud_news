import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../../article_detail/domain/entities/author.dart';
import '../bloc/authors_bloc.dart';
import '../widgets/author_card.dart';

/// Authors directory page.
///
/// Displays a searchable list of all active authors/writers.
class AuthorsPage extends StatefulWidget {
  const AuthorsPage({super.key});

  @override
  State<AuthorsPage> createState() => _AuthorsPageState();
}

class _AuthorsPageState extends State<AuthorsPage> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    context.read<AuthorsBloc>().add(const LoadAuthors());
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Author> _filterAuthors(List<Author> authors) {
    if (_searchQuery.isEmpty) return authors;
    final query = _searchQuery.toLowerCase();
    return authors.where((author) {
      return author.nameHe.toLowerCase().contains(query) ||
          (author.nameEn?.toLowerCase().contains(query) ?? false) ||
          (author.roleHe?.toLowerCase().contains(query) ?? false);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'authors_title'.tr(),
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
                hintText: 'search_authors_hint'.tr(),
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
          // Authors list.
          Expanded(
            child: BlocBuilder<AuthorsBloc, AuthorsState>(
              builder: (context, state) {
                if (state is AuthorsLoading || state is AuthorsInitial) {
                  return _buildLoadingState();
                }

                if (state is AuthorsError) {
                  return ErrorView(
                    message: state.message,
                    onRetry: () =>
                        context.read<AuthorsBloc>().add(const LoadAuthors()),
                  );
                }

                if (state is AuthorsLoaded) {
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
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadedState(BuildContext context, AuthorsLoaded state) {
    final filtered = _filterAuthors(state.authors);

    if (filtered.isEmpty) {
      return Center(
        child: Text(
          _searchQuery.isNotEmpty
              ? 'no_results'.tr()
              : 'no_authors'.tr(),
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
        final author = filtered[index];
        return AuthorCard(
          author: author,
          onTap: () => context.push('/author/${author.id}'),
        );
      },
    );
  }
}
