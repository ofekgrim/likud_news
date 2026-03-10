import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../bloc/user_profile_bloc.dart';
import '../widgets/profile_avatar.dart';
import '../widgets/verification_dialog.dart';

/// Edit profile page allowing the user to update avatar, display name,
/// phone, email, and bio.
class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();
  final _displayNameController = TextEditingController();
  final _bioController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  bool _initialized = false;
  String? _currentAvatarUrl;

  @override
  void initState() {
    super.initState();
    context.read<UserProfileBloc>().add(const LoadProfile());
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    _bioController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  /// Pre-fill fields from the current profile state (once).
  void _initializeFromState(UserProfileState state) {
    if (_initialized) return;
    if (state is UserProfileLoaded) {
      _displayNameController.text = state.user.displayName ?? '';
      _bioController.text = state.user.bio ?? '';
      _phoneController.text = state.user.phone ?? '';
      _emailController.text = state.user.email ?? '';
      _currentAvatarUrl = state.user.avatarUrl;
      _initialized = true;
    }
  }

  Future<void> _pickAvatar() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 85,
    );
    if (image != null && mounted) {
      context.read<UserProfileBloc>().add(
            PickAndUploadAvatarEvent(filePath: image.path),
          );
    }
  }

  InputDecoration _fieldDecoration({required String hint, required BuildContext context}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
        fontFamily: 'Heebo',
        color: context.colors.textTertiary,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: context.colors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: context.colors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: AppColors.likudBlue,
          width: 1.5,
        ),
      ),
      filled: true,
      fillColor: context.colors.cardSurface,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 14,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: context.colors.surfaceVariant,
        appBar: AppBar(
          backgroundColor: AppColors.likudBlue,
          title: Text(
            'profile_edit'.tr(),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.white,
            ),
          ),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: AppColors.white),
            onPressed: () => context.pop(),
          ),
        ),
        body: BlocConsumer<UserProfileBloc, UserProfileState>(
          listener: (context, state) {
            if (state is UserProfileUpdated) {
              setState(() {
                _currentAvatarUrl = state.user.avatarUrl;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'profile_update_success'.tr(),
                    style: const TextStyle(fontFamily: 'Heebo'),
                  ),
                  backgroundColor: AppColors.success,
                ),
              );
              context.pop();
            } else if (state is PasswordChanged) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'password_changed_success'.tr(),
                    style: const TextStyle(fontFamily: 'Heebo'),
                  ),
                  backgroundColor: AppColors.success,
                ),
              );
            } else if (state is PhoneOtpSent) {
              _showPhoneVerificationDialog(state.phone);
            } else if (state is EmailCodeSent) {
              _showEmailVerificationDialog(state.email);
            } else if (state is PhoneVerified) {
              setState(() {
                _phoneController.text = state.user.phone ?? '';
                _currentAvatarUrl = state.user.avatarUrl;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('phone_verified_success'.tr(), style: const TextStyle(fontFamily: 'Heebo')),
                  backgroundColor: AppColors.success,
                ),
              );
            } else if (state is EmailVerified) {
              setState(() {
                _emailController.text = state.user.email ?? '';
                _currentAvatarUrl = state.user.avatarUrl;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('email_verified_success'.tr(), style: const TextStyle(fontFamily: 'Heebo')),
                  backgroundColor: AppColors.success,
                ),
              );
            } else if (state is AccountDeleted) {
              context.read<AuthBloc>().add(const LogoutEvent());
              context.go('/login');
            } else if (state is UserProfileError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    state.message,
                    style: const TextStyle(fontFamily: 'Heebo'),
                  ),
                  backgroundColor: AppColors.breakingRed,
                ),
              );
            }
          },
          builder: (context, state) {
            _initializeFromState(state);

            final isUpdating = state is UserProfileUpdating;

            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Avatar section.
                    Center(
                      child: GestureDetector(
                        onTap: isUpdating ? null : _pickAvatar,
                        child: ProfileAvatar(
                          imageUrl: _currentAvatarUrl,
                          displayName: _displayNameController.text,
                          radius: 50,
                          showEditOverlay: true,
                          onEditTap: isUpdating ? null : _pickAvatar,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Center(
                      child: Text(
                        'profile_change_photo'.tr(),
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 13,
                          color: AppColors.likudBlue,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Display name field.
                    Text(
                      'profile_display_name'.tr(),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: context.colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _displayNameController,
                      enabled: !isUpdating,
                      decoration: _fieldDecoration(
                        hint: 'profile_display_name_hint'.tr(),
                        context: context,
                      ),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 15,
                        color: context.colors.textPrimary,
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'profile_display_name_required'.tr();
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 24),

                    // Phone field (read-only + change button).
                    Text(
                      'profile_phone'.tr(),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: context.colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _phoneController,
                            enabled: false,
                            textDirection: TextDirection.ltr,
                            decoration: _fieldDecoration(
                              hint: 'profile_phone_hint'.tr(),
                              context: context,
                            ),
                            style: TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 15,
                              color: context.colors.textSecondary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        SizedBox(
                          height: 48,
                          child: OutlinedButton(
                            onPressed: isUpdating ? null : _showChangePhoneDialog,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.likudBlue,
                              side: const BorderSide(color: AppColors.likudBlue),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                            ),
                            child: Text(
                              'change_phone'.tr(),
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Email field (read-only + change button).
                    Text(
                      'profile_email'.tr(),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: context.colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _emailController,
                            enabled: false,
                            textDirection: TextDirection.ltr,
                            decoration: _fieldDecoration(
                              hint: 'profile_email_hint'.tr(),
                              context: context,
                            ),
                            style: TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 15,
                              color: context.colors.textSecondary,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        SizedBox(
                          height: 48,
                          child: OutlinedButton(
                            onPressed: isUpdating ? null : _showChangeEmailDialog,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.likudBlue,
                              side: const BorderSide(color: AppColors.likudBlue),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                            ),
                            child: Text(
                              'change_email'.tr(),
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Bio field.
                    Text(
                      'profile_bio'.tr(),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: context.colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _bioController,
                      enabled: !isUpdating,
                      maxLines: 5,
                      maxLength: 300,
                      decoration: _fieldDecoration(
                        hint: 'profile_bio_hint'.tr(),
                        context: context,
                      ),
                      style: TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 15,
                        color: context.colors.textPrimary,
                        height: 1.5,
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Save button.
                    SizedBox(
                      height: 48,
                      child: FilledButton(
                        onPressed: isUpdating ? null : _onSave,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.likudBlue,
                          disabledBackgroundColor:
                              AppColors.likudBlue.withValues(alpha: 0.5),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: isUpdating
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  color: AppColors.white,
                                  strokeWidth: 2.5,
                                ),
                              )
                            : Text(
                                'profile_save'.tr(),
                                style: const TextStyle(
                                  fontFamily: 'Heebo',
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.white,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Change password button.
                    SizedBox(
                      height: 48,
                      child: OutlinedButton.icon(
                        onPressed: isUpdating ? null : _showChangePasswordDialog,
                        icon: const Icon(Icons.lock_outline, size: 20),
                        label: Text(
                          'change_password'.tr(),
                          style: const TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.likudBlue,
                          side: const BorderSide(color: AppColors.likudBlue),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Delete account button.
                    SizedBox(
                      height: 48,
                      child: OutlinedButton.icon(
                        onPressed: isUpdating ? null : _showDeleteAccountDialog,
                        icon: const Icon(Icons.delete_forever, size: 20),
                        label: Text(
                          'delete_account'.tr(),
                          style: const TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.breakingRed,
                          side: const BorderSide(color: AppColors.breakingRed),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
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
      ),
    );
  }

  void _showChangePasswordDialog() {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (dialogContext) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            title: Text(
              'change_password'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontWeight: FontWeight.w700,
              ),
            ),
            content: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: currentPasswordController,
                    obscureText: true,
                    textDirection: TextDirection.ltr,
                    decoration: _fieldDecoration(
                      hint: 'current_password'.tr(),
                      context: context,
                    ),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 15,
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'current_password_required'.tr();
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: newPasswordController,
                    obscureText: true,
                    textDirection: TextDirection.ltr,
                    decoration: _fieldDecoration(
                      hint: 'new_password'.tr(),
                      context: context,
                    ),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 15,
                    ),
                    validator: (value) {
                      if (value == null || value.length < 8) {
                        return 'new_password_too_short'.tr();
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: confirmPasswordController,
                    obscureText: true,
                    textDirection: TextDirection.ltr,
                    decoration: _fieldDecoration(
                      hint: 'confirm_new_password'.tr(),
                      context: context,
                    ),
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 15,
                    ),
                    validator: (value) {
                      if (value != newPasswordController.text) {
                        return 'new_passwords_dont_match'.tr();
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: Text(
                  'cancel'.tr(),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    color: context.colors.textSecondary,
                  ),
                ),
              ),
              FilledButton(
                onPressed: () {
                  if (!formKey.currentState!.validate()) return;
                  Navigator.of(dialogContext).pop();
                  context.read<UserProfileBloc>().add(
                        ChangePasswordEvent(
                          currentPassword: currentPasswordController.text,
                          newPassword: newPasswordController.text,
                        ),
                      );
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.likudBlue,
                ),
                child: Text(
                  'profile_save'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontWeight: FontWeight.w600,
                    color: AppColors.white,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _onSave() {
    if (!_formKey.currentState!.validate()) return;
    context.read<UserProfileBloc>().add(
          UpdateProfileEvent(
            displayName: _displayNameController.text.trim(),
            bio: _bioController.text.trim(),
          ),
        );
  }

  void _showChangePhoneDialog() {
    final phoneController = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogContext) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            title: Text(
              'change_phone'.tr(),
              style: const TextStyle(fontFamily: 'Heebo', fontWeight: FontWeight.w700),
            ),
            content: TextField(
              controller: phoneController,
              textDirection: TextDirection.ltr,
              keyboardType: TextInputType.phone,
              decoration: _fieldDecoration(hint: 'enter_new_phone'.tr(), context: context),
              style: const TextStyle(fontFamily: 'Heebo', fontSize: 15),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: Text(
                  'cancel'.tr(),
                  style: TextStyle(fontFamily: 'Heebo', color: context.colors.textSecondary),
                ),
              ),
              FilledButton(
                onPressed: () {
                  final phone = phoneController.text.trim();
                  if (phone.isEmpty) return;
                  Navigator.of(dialogContext).pop();
                  context.read<UserProfileBloc>().add(
                        RequestPhoneChangeEvent(phone: phone),
                      );
                },
                style: FilledButton.styleFrom(backgroundColor: AppColors.likudBlue),
                child: Text(
                  'send_verification_code'.tr(),
                  style: const TextStyle(fontFamily: 'Heebo', fontWeight: FontWeight.w600, color: AppColors.white),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showChangeEmailDialog() {
    final emailCtrl = TextEditingController();
    final passwordCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (dialogContext) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            title: Text(
              'change_email'.tr(),
              style: const TextStyle(fontFamily: 'Heebo', fontWeight: FontWeight.w700),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: emailCtrl,
                  textDirection: TextDirection.ltr,
                  keyboardType: TextInputType.emailAddress,
                  decoration: _fieldDecoration(hint: 'enter_new_email'.tr(), context: context),
                  style: const TextStyle(fontFamily: 'Heebo', fontSize: 15),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: passwordCtrl,
                  obscureText: true,
                  textDirection: TextDirection.ltr,
                  decoration: _fieldDecoration(hint: 'enter_password_to_change_email'.tr(), context: context),
                  style: const TextStyle(fontFamily: 'Heebo', fontSize: 15),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: Text(
                  'cancel'.tr(),
                  style: TextStyle(fontFamily: 'Heebo', color: context.colors.textSecondary),
                ),
              ),
              FilledButton(
                onPressed: () {
                  final email = emailCtrl.text.trim();
                  final password = passwordCtrl.text;
                  if (email.isEmpty || password.isEmpty) return;
                  Navigator.of(dialogContext).pop();
                  context.read<UserProfileBloc>().add(
                        RequestEmailChangeEvent(
                          email: email,
                          currentPassword: password,
                        ),
                      );
                },
                style: FilledButton.styleFrom(backgroundColor: AppColors.likudBlue),
                child: Text(
                  'send_verification_code'.tr(),
                  style: const TextStyle(fontFamily: 'Heebo', fontWeight: FontWeight.w600, color: AppColors.white),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showDeleteAccountDialog() {
    final passwordController = TextEditingController();

    showDialog(
      context: context,
      builder: (dialogContext) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            title: Text(
              'delete_account'.tr(),
              style: const TextStyle(
                fontFamily: 'Heebo',
                fontWeight: FontWeight.w700,
                color: AppColors.breakingRed,
              ),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'delete_account_warning'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    color: AppColors.breakingRed,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: passwordController,
                  obscureText: true,
                  textDirection: TextDirection.ltr,
                  decoration: _fieldDecoration(
                    hint: 'enter_password_to_delete'.tr(),
                    context: context,
                  ),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 15,
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: Text(
                  'cancel'.tr(),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    color: context.colors.textSecondary,
                  ),
                ),
              ),
              FilledButton(
                onPressed: () {
                  final password = passwordController.text;
                  if (password.isEmpty) return;
                  Navigator.of(dialogContext).pop();
                  context.read<UserProfileBloc>().add(
                        DeleteAccountEvent(password: password),
                      );
                },
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.breakingRed,
                ),
                child: Text(
                  'delete_account_confirm'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontWeight: FontWeight.w600,
                    color: AppColors.white,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _showPhoneVerificationDialog(String phone) async {
    final code = await showVerificationDialog(
      context,
      target: phone,
      isPhone: true,
      onResend: () {
        context.read<UserProfileBloc>().add(
              RequestPhoneChangeEvent(phone: phone),
            );
      },
    );
    if (code != null && mounted) {
      context.read<UserProfileBloc>().add(
            VerifyPhoneChangeEvent(phone: phone, code: code),
          );
    }
  }

  Future<void> _showEmailVerificationDialog(String email) async {
    final code = await showVerificationDialog(
      context,
      target: email,
      isPhone: false,
      onResend: () {
        // For email resend, we'd need the password again. For now just show info.
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('resend_email_change_note'.tr(), style: const TextStyle(fontFamily: 'Heebo')),
          ),
        );
      },
    );
    if (code != null && mounted) {
      context.read<UserProfileBloc>().add(
            VerifyEmailChangeEvent(email: email, code: code),
          );
    }
  }
}
