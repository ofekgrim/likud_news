import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../domain/entities/quiz_election.dart';
import '../bloc/quiz_list_bloc.dart';

/// Displays a list of available quiz elections so the user can pick one.
class QuizListPage extends StatefulWidget {
  const QuizListPage({super.key});

  @override
  State<QuizListPage> createState() => _QuizListPageState();
}

class _QuizListPageState extends State<QuizListPage> {
  @override
  void initState() {
    super.initState();
    context.read<QuizListBloc>().add(const LoadQuizElections());
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AppColors.surfaceLight,
        appBar: AppBar(
          backgroundColor: AppColors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: AppColors.textPrimary),
            onPressed: () => context.pop(),
          ),
          centerTitle: true,
          title: Text(
            'quiz_list_title'.tr(),
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ),
        body: BlocBuilder<QuizListBloc, QuizListState>(
          builder: (context, state) {
            if (state is QuizListLoading) {
              return const Center(
                child: CircularProgressIndicator(color: AppColors.likudBlue),
              );
            }

            if (state is QuizListError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: AppColors.breakingRed),
                    const SizedBox(height: 16),
                    Text(
                      'quiz_list_error'.tr(),
                      style: const TextStyle(fontFamily: 'Heebo', fontSize: 15, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.read<QuizListBloc>().add(const LoadQuizElections()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.likudBlue,
                        foregroundColor: AppColors.white,
                      ),
                      child: Text('quiz_retry'.tr()),
                    ),
                  ],
                ),
              );
            }

            if (state is QuizListLoaded) {
              if (state.elections.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.quiz_outlined, size: 64, color: AppColors.textTertiary.withValues(alpha: 0.5)),
                      const SizedBox(height: 16),
                      Text(
                        'quiz_list_empty'.tr(),
                        style: const TextStyle(fontFamily: 'Heebo', fontSize: 16, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                );
              }

              return RefreshIndicator(
                onRefresh: () async {
                  context.read<QuizListBloc>().add(const LoadQuizElections());
                },
                color: AppColors.likudBlue,
                child: ListView.builder(
                  padding: const EdgeInsetsDirectional.all(16),
                  itemCount: state.elections.length + 1,
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return _buildHeader();
                    }
                    return _buildQuizCard(state.elections[index - 1]);
                  },
                ),
              );
            }

            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Hero section
          Container(
            width: double.infinity,
            padding: const EdgeInsetsDirectional.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: [
                  AppColors.likudBlue,
                  AppColors.likudBlue.withValues(alpha: 0.85),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'quiz_list_title'.tr(),
                        style: const TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppColors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'quiz_list_subtitle'.tr(),
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 13,
                          color: AppColors.white.withValues(alpha: 0.85),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.quiz_outlined, size: 28, color: AppColors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuizCard(QuizElection election) {
    final isCompleted = election.hasCompleted;
    final statusLabel = _getStatusLabel(election.status);
    final statusColor = _getStatusColor(election.status);

    return Padding(
      padding: const EdgeInsetsDirectional.only(bottom: 12),
      child: Material(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(14),
        elevation: 0,
        child: InkWell(
          onTap: () {
            if (isCompleted) {
              // Go directly to results
              context.push('/primaries/quiz/${election.id}/results');
            } else {
              // Go to intro page
              context.push('/primaries/quiz/${election.id}');
            }
          },
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsetsDirectional.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isCompleted
                    ? AppColors.success.withValues(alpha: 0.3)
                    : AppColors.border,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row: status badge + check icon
                Row(
                  children: [
                    // Status badge
                    Container(
                      padding: const EdgeInsetsDirectional.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        statusLabel,
                        style: TextStyle(
                          fontFamily: 'Heebo',
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: statusColor,
                        ),
                      ),
                    ),
                    const Spacer(),
                    if (isCompleted)
                      Container(
                        padding: const EdgeInsetsDirectional.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.success.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.check_circle, size: 14, color: AppColors.success),
                            const SizedBox(width: 4),
                            Text(
                              'quiz_list_completed'.tr(),
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppColors.success,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                // Title
                Text(
                  election.title,
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (election.description != null && election.description!.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    election.description!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                // Info chips
                Row(
                  children: [
                    _buildInfoChip(
                      Icons.format_list_numbered,
                      'quiz_list_questions'.tr(namedArgs: {'count': '${election.questionCount}'}),
                    ),
                    const SizedBox(width: 12),
                    _buildInfoChip(
                      Icons.people_outline,
                      'quiz_list_candidates'.tr(namedArgs: {'count': '${election.candidateCount}'}),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                // Action button
                SizedBox(
                  width: double.infinity,
                  height: 42,
                  child: isCompleted
                      ? OutlinedButton.icon(
                          onPressed: () {
                            context.push('/primaries/quiz/${election.id}/results');
                          },
                          icon: const Icon(Icons.bar_chart_outlined, size: 18),
                          label: Text('quiz_list_view_results'.tr()),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.likudBlue,
                            side: const BorderSide(color: AppColors.likudBlue),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            textStyle: const TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        )
                      : ElevatedButton.icon(
                          onPressed: () {
                            context.push('/primaries/quiz/${election.id}');
                          },
                          icon: const Icon(Icons.play_arrow_outlined, size: 18),
                          label: Text('quiz_list_start'.tr()),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.likudBlue,
                            foregroundColor: AppColors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            textStyle: const TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: AppColors.textTertiary),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(
            fontFamily: 'Heebo',
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'active':
      case 'voting':
        return 'quiz_list_status_active'.tr();
      case 'completed':
        return 'quiz_list_status_completed'.tr();
      case 'upcoming':
        return 'quiz_list_status_upcoming'.tr();
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
      case 'voting':
        return AppColors.likudBlue;
      case 'completed':
        return AppColors.textTertiary;
      case 'upcoming':
        return AppColors.warning;
      default:
        return AppColors.textSecondary;
    }
  }
}
