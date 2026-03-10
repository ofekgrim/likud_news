import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../bloc/auth_bloc.dart';
import '../widgets/phone_input_field.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isPhoneMode = true;

  @override
  void dispose() {
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: BlocListener<AuthBloc, AuthState>(
          listener: (context, state) {
            if (state is OtpSent) {
              context.push('/otp-verify', extra: state.phone);
            } else if (state is AuthAuthenticated) {
              context.go('/');
            } else if (state is AuthUserNotFound) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('user_not_found_register'.tr()),
                  backgroundColor: AppColors.likudBlue,
                ),
              );
              context.push('/register', extra: state.isPhone
                  ? {'phone': state.identifier}
                  : {'email': state.identifier});
            } else if (state is AuthError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: AppColors.breakingRed,
                ),
              );
              context.read<AuthBloc>().add(const ClearAuthError());
            }
          },
          child: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsetsDirectional.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 60),
                  // Logo
                  Center(
                    child: Image.asset(
                      'assets/images/logo.png',
                      height: 80,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.account_balance,
                        size: 80,
                        color: AppColors.likudBlue,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'login_title'.tr(),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'login_subtitle'.tr(),
                    style: const TextStyle(
                      fontSize: 16,
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 40),

                  // Toggle Phone / Email
                  _buildModeToggle(),
                  const SizedBox(height: 24),

                  if (_isPhoneMode) ...[
                    PhoneInputField(
                      controller: _phoneController,
                      onSubmitted: _submitPhone,
                    ),
                    const SizedBox(height: 24),
                    _buildSubmitButton(
                      label: 'send_otp'.tr(),
                      onPressed: _submitPhone,
                    ),
                  ] else ...[
                    _buildEmailField(),
                    const SizedBox(height: 16),
                    _buildPasswordField(),
                    const SizedBox(height: 24),
                    _buildSubmitButton(
                      label: 'login'.tr(),
                      onPressed: _submitEmail,
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => context.push('/register'),
                      child: Text(
                        'no_account_register'.tr(),
                        style: const TextStyle(color: AppColors.likudBlue),
                      ),
                    ),
                  ],

                  const SizedBox(height: 24),
                  TextButton(
                    onPressed: () => context.pop(),
                    child: Text(
                      'continue_as_guest'.tr(),
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildModeToggle() {
    return Row(
      children: [
        Expanded(
          child: _ToggleButton(
            label: 'phone_login'.tr(),
            isActive: _isPhoneMode,
            onTap: () => setState(() => _isPhoneMode = true),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _ToggleButton(
            label: 'email_login'.tr(),
            isActive: !_isPhoneMode,
            onTap: () => setState(() => _isPhoneMode = false),
          ),
        ),
      ],
    );
  }

  Widget _buildEmailField() {
    return TextField(
      controller: _emailController,
      keyboardType: TextInputType.emailAddress,
      textDirection: TextDirection.ltr,
      decoration: InputDecoration(
        labelText: 'email'.tr(),
        prefixIcon: const Icon(Icons.email_outlined),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.likudBlue, width: 2),
        ),
      ),
    );
  }

  Widget _buildPasswordField() {
    return TextField(
      controller: _passwordController,
      obscureText: true,
      textDirection: TextDirection.ltr,
      decoration: InputDecoration(
        labelText: 'password'.tr(),
        prefixIcon: const Icon(Icons.lock_outline),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.likudBlue, width: 2),
        ),
      ),
      onSubmitted: (_) => _submitEmail(),
    );
  }

  Widget _buildSubmitButton({
    required String label,
    required VoidCallback onPressed,
  }) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        final isLoading = state is AuthLoading;
        return SizedBox(
          height: 52,
          child: ElevatedButton(
            onPressed: isLoading ? null : onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.likudBlue,
              foregroundColor: AppColors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              textStyle: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            child: isLoading
                ? const SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: AppColors.white,
                    ),
                  )
                : Text(label),
          ),
        );
      },
    );
  }

  void _submitPhone() {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) return;
    context.read<AuthBloc>().add(RequestOtpEvent(phone: phone));
  }

  void _submitEmail() {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) return;
    context.read<AuthBloc>().add(
          LoginEmailEvent(email: email, password: password),
        );
  }
}

class _ToggleButton extends StatelessWidget {
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _ToggleButton({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? AppColors.likudBlue : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isActive ? AppColors.likudBlue : AppColors.border,
          ),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: isActive ? AppColors.white : AppColors.textSecondary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
