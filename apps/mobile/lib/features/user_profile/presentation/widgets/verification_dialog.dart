import 'dart:async';

import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../app/theme/app_colors.dart';

/// Shows a verification code bottom sheet and returns the entered code, or null if cancelled.
Future<String?> showVerificationDialog(
  BuildContext context, {
  required String target,
  required bool isPhone,
  VoidCallback? onResend,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (ctx) => _VerificationDialogContent(
      target: target,
      isPhone: isPhone,
      onResend: onResend,
    ),
  );
}

class _VerificationDialogContent extends StatefulWidget {
  final String target;
  final bool isPhone;
  final VoidCallback? onResend;

  const _VerificationDialogContent({
    required this.target,
    required this.isPhone,
    this.onResend,
  });

  @override
  State<_VerificationDialogContent> createState() =>
      _VerificationDialogContentState();
}

class _VerificationDialogContentState
    extends State<_VerificationDialogContent> {
  final _controller = TextEditingController();
  Timer? _timer;
  int _countdown = 60;
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _startCountdown() {
    _countdown = 60;
    _canResend = false;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      setState(() {
        _countdown--;
        if (_countdown <= 0) {
          _canResend = true;
          timer.cancel();
        }
      });
    });
  }

  void _onResend() {
    widget.onResend?.call();
    _startCountdown();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Title
            Text(
              widget.isPhone
                  ? 'verify_phone'.tr()
                  : 'verify_email'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),

            // Subtitle — where the code was sent
            Text(
              '${'send_verification_code'.tr()} ${widget.target}',
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),

            // 6-digit code input
            SizedBox(
              width: 240,
              child: TextField(
                controller: _controller,
                autofocus: true,
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(6),
                ],
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 12,
                  color: AppColors.textPrimary,
                ),
                decoration: InputDecoration(
                  hintText: '------',
                  hintStyle: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 28,
                    fontWeight: FontWeight.w400,
                    letterSpacing: 12,
                    color: AppColors.textSecondary.withValues(alpha: 0.3),
                  ),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(
                      color: AppColors.border,
                      width: 2,
                    ),
                  ),
                  focusedBorder: const UnderlineInputBorder(
                    borderSide: BorderSide(
                      color: AppColors.likudBlue,
                      width: 2,
                    ),
                  ),
                ),
                onChanged: (value) {
                  if (value.length == 6) {
                    Navigator.pop(context, value);
                  }
                },
              ),
            ),
            const SizedBox(height: 24),

            // Verify button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                onPressed: () {
                  final code = _controller.text.trim();
                  if (code.length == 6) {
                    Navigator.pop(context, code);
                  }
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.likudBlue,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(
                  widget.isPhone
                      ? 'verify_phone'.tr()
                      : 'verify_email'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Resend button with countdown
            TextButton(
              onPressed: _canResend ? _onResend : null,
              child: Text(
                _canResend
                    ? 'resend_code'.tr()
                    : '${'resend_code_in'.tr()} $_countdown',
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: _canResend
                      ? AppColors.likudBlue
                      : AppColors.textSecondary,
                ),
              ),
            ),

            // Cancel
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'cancel'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
