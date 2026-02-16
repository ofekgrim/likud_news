import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/rtl_scaffold.dart';
import '../bloc/contact_bloc.dart';

/// Contact form page for submitting messages.
///
/// Includes fields for name, email, phone, subject, and message.
/// RTL-aware with Hebrew labels.
class ContactPage extends StatefulWidget {
  const ContactPage({super.key});

  @override
  State<ContactPage> createState() => _ContactPageState();
}

class _ContactPageState extends State<ContactPage> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RtlScaffold(
      appBar: AppBar(
        title: Text(
          'contact_us'.tr(),
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: BlocConsumer<ContactBloc, ContactState>(
        listener: (context, state) {
          if (state is ContactSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('message_sent'.tr()),
                backgroundColor: AppColors.success,
              ),
            );
            _formKey.currentState?.reset();
            _nameController.clear();
            _emailController.clear();
            _phoneController.clear();
            _subjectController.clear();
            _messageController.clear();
          } else if (state is ContactError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.breakingRed,
              ),
            );
          }
        },
        builder: (context, state) {
          final isSubmitting = state is ContactSubmitting;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 8),
                  // Name field
                  TextFormField(
                    controller: _nameController,
                    enabled: !isSubmitting,
                    textDirection: TextDirection.rtl,
                    decoration: _inputDecoration(
                      label: 'full_name'.tr(),
                      icon: Icons.person_outline,
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'full_name_required'.tr();
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Email field
                  TextFormField(
                    controller: _emailController,
                    enabled: !isSubmitting,
                    textDirection: TextDirection.ltr,
                    keyboardType: TextInputType.emailAddress,
                    decoration: _inputDecoration(
                      label: 'email'.tr(),
                      icon: Icons.email_outlined,
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'email_required'.tr();
                      }
                      final emailRegex = RegExp(
                        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
                      );
                      if (!emailRegex.hasMatch(value.trim())) {
                        return 'email_invalid'.tr();
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Phone field (optional)
                  TextFormField(
                    controller: _phoneController,
                    enabled: !isSubmitting,
                    textDirection: TextDirection.ltr,
                    keyboardType: TextInputType.phone,
                    decoration: _inputDecoration(
                      label: 'phone'.tr(),
                      icon: Icons.phone_outlined,
                      isOptional: true,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Subject field
                  TextFormField(
                    controller: _subjectController,
                    enabled: !isSubmitting,
                    textDirection: TextDirection.rtl,
                    decoration: _inputDecoration(
                      label: 'subject'.tr(),
                      icon: Icons.subject_outlined,
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'subject_required'.tr();
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Message field (multiline)
                  TextFormField(
                    controller: _messageController,
                    enabled: !isSubmitting,
                    textDirection: TextDirection.rtl,
                    maxLines: 5,
                    minLines: 3,
                    keyboardType: TextInputType.multiline,
                    decoration: _inputDecoration(
                      label: 'message'.tr(),
                      icon: Icons.message_outlined,
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'message_required'.tr();
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),

                  // Submit button
                  SizedBox(
                    height: 48,
                    child: FilledButton(
                      onPressed: isSubmitting ? null : _onSubmit,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.likudBlue,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.white,
                              ),
                            )
                          : Text(
                              'send'.tr(),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// Creates a consistent input decoration for form fields.
  InputDecoration _inputDecoration({
    required String label,
    required IconData icon,
    bool isOptional = false,
  }) {
    return InputDecoration(
      labelText: isOptional ? '$label ${'optional'.tr()}' : label,
      prefixIcon: Icon(icon, color: AppColors.textSecondary),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.likudBlue, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.breakingRed),
      ),
      filled: true,
      fillColor: AppColors.surfaceLight,
    );
  }

  /// Validates and submits the form.
  void _onSubmit() {
    if (_formKey.currentState?.validate() ?? false) {
      context.read<ContactBloc>().add(
            SubmitContactForm(
              name: _nameController.text.trim(),
              email: _emailController.text.trim(),
              phone: _phoneController.text.trim().isNotEmpty
                  ? _phoneController.text.trim()
                  : null,
              subject: _subjectController.text.trim(),
              message: _messageController.text.trim(),
            ),
          );
    }
  }
}
