import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../bloc/categories_bloc.dart';
import '../widgets/category_card.dart';

/// Categories grid page.
///
/// Displays all active categories in a 2-column grid layout.
/// Each card shows the category icon, name, and a colored accent.
/// Tapping a card navigates to the category articles view.
class CategoriesPage extends StatefulWidget {
  const CategoriesPage({super.key});

  @override
  State<CategoriesPage> createState() => _CategoriesPageState();
}

class _CategoriesPageState extends State<CategoriesPage> {
  @override
  void initState() {
    super.initState();
    context.read<CategoriesBloc>().add(const LoadCategories());
  }

  Future<void> _onRefresh() async {
    context.read<CategoriesBloc>().add(const LoadCategories());
    await context.read<CategoriesBloc>().stream.firstWhere(
          (state) => state is CategoriesLoaded || state is CategoriesError,
        );
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'categories'.tr(),
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: BlocBuilder<CategoriesBloc, CategoriesState>(
        builder: (context, state) {
          if (state is CategoriesLoading || state is CategoriesInitial) {
            return _buildLoadingState();
          }

          if (state is CategoriesError) {
            return ErrorView(
              message: state.message,
              onRetry: () =>
                  context.read<CategoriesBloc>().add(const LoadCategories()),
            );
          }

          if (state is CategoriesLoaded) {
            return _buildLoadedState(context, state);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.2,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => const ShimmerLoading(
        borderRadius: 12,
      ),
    );
  }

  Widget _buildLoadedState(BuildContext context, CategoriesLoaded state) {
    if (state.categories.isEmpty) {
      return EmptyView(
        message: 'no_categories'.tr(),
        icon: Icons.category_outlined,
      );
    }

    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: AppColors.likudBlue,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.2,
        ),
        itemCount: state.categories.length,
        itemBuilder: (context, index) {
          final category = state.categories[index];
          return CategoryCard(
            category: category,
            onTap: () {
              context.push('/category/${category.slug ?? ''}');
            },
          );
        },
      ),
    );
  }
}
