import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';

import '../../app/theme/app_colors.dart';
import '../services/app_logger.dart';
import 'models/share_link.dart';
import 'share_service.dart';

/// Reusable WhatsApp share button.
///
/// Shows a WhatsApp-green icon button. On tap it calls the backend to create
/// a share link with OG metadata, then opens WhatsApp (with system-share
/// fallback). Displays a loading indicator while the link is being created.
class WhatsAppShareButton extends StatefulWidget {
  /// The type of content being shared.
  final ShareContentType contentType;

  /// The UUID of the content being shared.
  final String contentId;

  /// User-visible share text prepended before the link.
  final String shareText;

  /// Optional OG title for the link preview.
  final String? title;

  /// Optional OG description for the link preview.
  final String? description;

  /// Optional OG image URL for the link preview.
  final String? imageUrl;

  /// Optional icon size override. Defaults to 20.
  final double iconSize;

  /// Optional widget size override. Defaults to 40.
  final double size;

  /// Whether to show a text label next to the icon. Defaults to false.
  final bool showLabel;

  const WhatsAppShareButton({
    super.key,
    required this.contentType,
    required this.contentId,
    required this.shareText,
    this.title,
    this.description,
    this.imageUrl,
    this.iconSize = 20,
    this.size = 40,
    this.showLabel = false,
  });

  @override
  State<WhatsAppShareButton> createState() => _WhatsAppShareButtonState();
}

class _WhatsAppShareButtonState extends State<WhatsAppShareButton> {
  bool _isLoading = false;

  Future<void> _onTap() async {
    if (_isLoading) return;

    setState(() => _isLoading = true);

    try {
      final shareService = GetIt.instance<ShareService>();
      await shareService.shareContent(
        widget.contentType,
        widget.contentId,
        widget.shareText,
        title: widget.title,
        description: widget.description,
        imageUrl: widget.imageUrl,
      );
    } catch (e) {
      AppLogger.instance.error('Share failed', e);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('share_failed'.tr()),
            backgroundColor: AppColors.breakingRed,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const whatsAppGreen = Color(0xFF25D366);

    if (widget.showLabel) {
      return _buildLabelButton(whatsAppGreen);
    }

    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: _isLoading
          ? Center(
              child: SizedBox(
                width: widget.iconSize,
                height: widget.iconSize,
                child: const CircularProgressIndicator(
                  strokeWidth: 2,
                  color: whatsAppGreen,
                ),
              ),
            )
          : IconButton(
              padding: EdgeInsets.zero,
              iconSize: widget.iconSize,
              icon: const Icon(Icons.chat, color: whatsAppGreen),
              tooltip: 'share_to_whatsapp'.tr(),
              onPressed: _onTap,
            ),
    );
  }

  /// Builds a full-width labeled button variant for prominent share actions.
  Widget _buildLabelButton(Color whatsAppGreen) {
    return SizedBox(
      height: 48,
      child: ElevatedButton.icon(
        onPressed: _isLoading ? null : _onTap,
        icon: _isLoading
            ? SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: whatsAppGreen,
                ),
              )
            : const Icon(Icons.chat, size: 18),
        label: Text(
          _isLoading ? 'creating_link'.tr() : 'share_to_whatsapp'.tr(),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: whatsAppGreen,
          foregroundColor: AppColors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
          textStyle: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
