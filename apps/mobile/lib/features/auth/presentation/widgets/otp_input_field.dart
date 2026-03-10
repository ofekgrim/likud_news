import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../../app/theme/app_colors.dart';

class OtpInputField extends StatelessWidget {
  final TextEditingController controller;
  final String? errorText;
  final VoidCallback? onCompleted;

  const OtpInputField({
    super.key,
    required this.controller,
    this.errorText,
    this.onCompleted,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      textAlign: TextAlign.center,
      style: const TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        letterSpacing: 16,
      ),
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(6),
      ],
      decoration: InputDecoration(
        labelText: 'otp_code'.tr(),
        hintText: '000000',
        hintStyle: TextStyle(
          color: AppColors.textTertiary.withValues(alpha: 0.4),
          fontSize: 32,
          fontWeight: FontWeight.bold,
          letterSpacing: 16,
        ),
        errorText: errorText,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.likudBlue, width: 2),
        ),
      ),
      onChanged: (value) {
        if (value.length == 6) {
          onCompleted?.call();
        }
      },
    );
  }
}
