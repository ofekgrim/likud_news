import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../widgets/onboarding_step.dart';

/// First-launch onboarding shown once to new users.
///
/// 3 slides: Welcome → Features → CTA (register / continue as guest).
/// Sets [SharedPreferences] key 'onboarding_done' = true on completion.
class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _StepData {
  final IconData icon;
  final String title;
  final String subtitle;
  const _StepData({required this.icon, required this.title, required this.subtitle});
}

class _OnboardingPageState extends State<OnboardingPage> {
  final _controller = PageController();
  int _currentPage = 0;

  static const _steps = [
    _StepData(
      icon: Icons.newspaper_rounded,
      title: 'ברוכים הבאים\nלמצודת הליכוד',
      subtitle: 'האפליקציה הרשמית של מפלגת הליכוד —\nחדשות, פריימריז ויום הבחירות',
    ),
    _StepData(
      icon: Icons.how_to_vote_rounded,
      title: 'הכל במקום אחד',
      subtitle: 'חדשות עדכניות בזמן אמת\n'
          'מידע על מועמדים ופריימריז\n'
          'מפת תחנות קלפי ותוצאות חיות',
    ),
    _StepData(
      icon: Icons.stars_rounded,
      title: 'הצטרפו לקהילה',
      subtitle: 'היו חלק מקהילת הליכוד —\nצברו נקודות, עקבו אחרי מועמדים\nוהשפיעו על העתיד',
    ),
  ];

  Future<void> _complete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_done', true);
    if (mounted) context.go('/');
  }

  void _next() {
    if (_currentPage < _steps.length - 1) {
      _controller.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    } else {
      _complete();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _currentPage == _steps.length - 1;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Column(
            children: [
              // Skip button
              Align(
                alignment: AlignmentDirectional.topEnd,
                child: TextButton(
                  onPressed: _complete,
                  child: const Text(
                    'דלג',
                    style: TextStyle(
                      color: Color(0xFF999999),
                      fontSize: 15,
                    ),
                  ),
                ),
              ),

              // Slides
              Expanded(
                child: PageView.builder(
                  controller: _controller,
                  onPageChanged: (i) => setState(() => _currentPage = i),
                  itemCount: _steps.length,
                  itemBuilder: (context, index) {
                    final step = _steps[index];
                    return OnboardingStep(
                      icon: step.icon,
                      title: step.title,
                      subtitle: step.subtitle,
                    );
                  },
                ),
              ),

              // Dot indicators
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _steps.length,
                  (i) => AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsetsDirectional.only(end: 6),
                    width: _currentPage == i ? 22 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4),
                      color: _currentPage == i
                          ? const Color(0xFF0099DB)
                          : const Color(0xFFDDDDDD),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // Primary CTA
              Padding(
                padding: const EdgeInsetsDirectional.fromSTEB(24, 0, 24, 0),
                child: SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _next,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0099DB),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      isLast ? 'התחל' : 'הבא',
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),

              // Secondary CTA (last screen only)
              if (isLast) ...[
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () {
                    _complete();
                    context.push('/auth/login');
                  },
                  child: const Text(
                    'הירשם / התחבר',
                    style: TextStyle(
                      color: Color(0xFF0099DB),
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
