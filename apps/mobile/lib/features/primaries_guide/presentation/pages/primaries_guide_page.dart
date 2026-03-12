import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../bloc/primaries_guide_bloc.dart';
import '../bloc/primaries_guide_event.dart';
import '../bloc/primaries_guide_state.dart';
import '../widgets/checklist_screen.dart';
import '../widgets/guide_dot_indicator.dart';
import '../widgets/guide_screen_widget.dart';

/// Full-screen primaries education guide with swipeable pages.
class PrimariesGuidePage extends StatefulWidget {
  const PrimariesGuidePage({super.key});

  @override
  State<PrimariesGuidePage> createState() => _PrimariesGuidePageState();
}

class _PrimariesGuidePageState extends State<PrimariesGuidePage> {
  late final PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _animateToPage(int index) {
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          'primaries_guide.title'.tr(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: context.colors.textPrimary,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: BlocConsumer<PrimariesGuideBloc, PrimariesGuideState>(
        listener: (context, state) {
          if (state is PrimariesGuideLoaded) {
            // Sync PageView with BLoC state
            if (_pageController.hasClients &&
                _pageController.page?.round() != state.currentIndex) {
              _animateToPage(state.currentIndex);
            }
          }
        },
        builder: (context, state) {
          if (state is PrimariesGuideLoaded) {
            return _buildGuide(context, state);
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildGuide(BuildContext context, PrimariesGuideLoaded state) {
    return SafeArea(
      child: Column(
        children: [
          // Page content
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              itemCount: state.screens.length,
              onPageChanged: (index) {
                context.read<PrimariesGuideBloc>().add(GoToScreen(index));
              },
              itemBuilder: (context, index) {
                // Last screen is the interactive checklist
                if (index == state.screens.length - 1) {
                  return const ChecklistScreen();
                }
                return GuideScreenWidget(screen: state.screens[index]);
              },
            ),
          ),

          // Bottom navigation area
          Padding(
            padding: const EdgeInsetsDirectional.fromSTEB(24, 0, 24, 16),
            child: Column(
              children: [
                // Dot indicators
                GuideDotIndicator(
                  count: state.screens.length,
                  activeIndex: state.currentIndex,
                  onDotTap: (index) {
                    context.read<PrimariesGuideBloc>().add(GoToScreen(index));
                  },
                ),
                const SizedBox(height: 24),

                // Navigation buttons
                _buildNavigationButtons(context, state),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons(
    BuildContext context,
    PrimariesGuideLoaded state,
  ) {
    final isFirst = state.currentIndex == 0;

    return Row(
      textDirection: TextDirection.rtl,
      children: [
        // Next / Finish button
        Expanded(
          child: FilledButton(
            onPressed: () {
              if (state.isLastScreen) {
                context.pop();
              } else {
                context.read<PrimariesGuideBloc>().add(const NextScreen());
              }
            },
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.likudBlue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              state.isLastScreen
                  ? 'primaries_guide.finish'.tr()
                  : 'primaries_guide.next'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),

        // Back button (hidden on first screen)
        if (!isFirst) ...[
          const SizedBox(width: 12),
          Expanded(
            child: OutlinedButton(
              onPressed: () {
                context
                    .read<PrimariesGuideBloc>()
                    .add(const PreviousScreen());
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.likudBlue,
                side: const BorderSide(color: AppColors.likudBlue),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'primaries_guide.back'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
