import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';

/// WhatsApp deep link button for reminding a friend to vote.
///
/// On tap, opens WhatsApp with a pre-filled message. Falls back to
/// the system share sheet if WhatsApp is not installed.
class RemindFriendButton extends StatelessWidget {
  const RemindFriendButton({super.key});

  Future<void> _onTap() async {
    final message = 'remind_friend.message'.tr();
    final encoded = Uri.encodeComponent(message);
    final whatsappUri = Uri.parse('https://wa.me/?text=$encoded');

    try {
      final launched = await launchUrl(
        whatsappUri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        await Share.share(message);
      }
    } catch (_) {
      await Share.share(message);
    }
  }

  @override
  Widget build(BuildContext context) {
    const whatsAppGreen = Color(0xFF25D366);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Container(
        margin: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 8),
        width: double.infinity,
        height: 48,
        child: ElevatedButton.icon(
          onPressed: _onTap,
          icon: const Icon(Icons.chat, size: 18),
          label: Text('remind_friend.button'.tr()),
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
      ),
    );
  }
}
