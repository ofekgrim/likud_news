import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../bloc/article_detail_bloc.dart';

/// Bottom action bar with social share buttons and bookmark toggle.
///
/// Provides share buttons for WhatsApp, Telegram, Facebook, X (Twitter),
/// copy link, and a bookmark/favorite toggle.
class ArticleActionsBar extends StatelessWidget {
  const ArticleActionsBar({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ArticleDetailBloc, ArticleDetailState>(
      builder: (context, state) {
        final isFavorite =
            state is ArticleDetailLoaded ? state.isFavorite : false;

        return Container(
          padding: EdgeInsets.only(
            left: 12,
            right: 12,
            top: 8,
            bottom: MediaQuery.of(context).padding.bottom + 8,
          ),
          decoration: BoxDecoration(
            color: AppColors.white,
            border: const Border(
              top: BorderSide(color: AppColors.border),
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.black.withValues(alpha: 0.06),
                blurRadius: 8,
                offset: const Offset(0, -2),
              ),
            ],
          ),
          child: Row(
            children: [
              // Share label
              Text(
                'share_label'.tr(),
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),

              // WhatsApp
              _ShareIconButton(
                icon: Icons.chat,
                color: const Color(0xFF25D366),
                tooltip: 'WhatsApp',
                onPressed: () => _share(context, SharePlatform.whatsapp),
              ),

              // Telegram
              _ShareIconButton(
                icon: Icons.send,
                color: const Color(0xFF0088CC),
                tooltip: 'Telegram',
                onPressed: () => _share(context, SharePlatform.telegram),
              ),

              // Facebook
              _ShareIconButton(
                icon: Icons.facebook,
                color: const Color(0xFF1877F2),
                tooltip: 'Facebook',
                onPressed: () => _share(context, SharePlatform.facebook),
              ),

              // X (Twitter)
              _ShareIconButton(
                icon: Icons.alternate_email,
                color: AppColors.textPrimary,
                tooltip: 'X',
                onPressed: () => _share(context, SharePlatform.x),
              ),

              // Copy link
              _ShareIconButton(
                icon: Icons.link,
                color: AppColors.textSecondary,
                tooltip: 'copy_link'.tr(),
                onPressed: () {
                  _share(context, SharePlatform.copyLink);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('link_copied'.tr()),
                      duration: const Duration(seconds: 2),
                    ),
                  );
                },
              ),

              const Spacer(),

              // Bookmark toggle
              IconButton(
                icon: Icon(
                  isFavorite ? Icons.bookmark : Icons.bookmark_border,
                  color: isFavorite
                      ? AppColors.likudBlue
                      : AppColors.textSecondary,
                ),
                tooltip: isFavorite ? 'remove_favorite'.tr() : 'save_article'.tr(),
                onPressed: () => context
                    .read<ArticleDetailBloc>()
                    .add(const ToggleFavoriteEvent()),
              ),
            ],
          ),
        );
      },
    );
  }

  void _share(BuildContext context, SharePlatform platform) {
    context.read<ArticleDetailBloc>().add(ShareArticle(platform));
  }
}

/// Small icon button for social share actions.
class _ShareIconButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String tooltip;
  final VoidCallback onPressed;

  const _ShareIconButton({
    required this.icon,
    required this.color,
    required this.tooltip,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 36,
      height: 36,
      child: IconButton(
        padding: EdgeInsets.zero,
        iconSize: 20,
        icon: Icon(icon, color: color),
        tooltip: tooltip,
        onPressed: onPressed,
      ),
    );
  }
}
