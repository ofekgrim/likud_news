import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/theme_context.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/campaign_event.dart';
import '../../domain/entities/event_rsvp.dart';
import '../bloc/events_bloc.dart';
import '../../../../core/utils/auth_guard.dart';
import '../../../../core/sharing/share_button.dart';
import '../../../../core/sharing/models/share_link.dart';

/// Full detail page for a single campaign event.
///
/// Uses a [CustomScrollView] with a collapsible [SliverAppBar] showing
/// the event image, title, description, date/time, location with navigation
/// button, candidate info card, and RSVP toggle buttons.
class EventDetailPage extends StatefulWidget {
  final String eventId;

  const EventDetailPage({super.key, required this.eventId});

  @override
  State<EventDetailPage> createState() => _EventDetailPageState();
}

class _EventDetailPageState extends State<EventDetailPage> {
  /// Tracks the locally selected RSVP status for optimistic UI.
  RsvpStatus? _selectedRsvpStatus;

  @override
  void initState() {
    super.initState();
    context.read<EventsBloc>().add(LoadEventDetail(id: widget.eventId));
  }

  Future<void> _openDirections(double lat, double lng) async {
    final url = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng',
    );
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }

  void _onRsvpSelected(RsvpStatus status) {
    if (!requireAuth(context)) return;
    setState(() => _selectedRsvpStatus = status);
    context.read<EventsBloc>().add(
          RsvpToEventAction(eventId: widget.eventId, status: status),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<EventsBloc, EventsState>(
        listener: (context, state) {
          if (state is RsvpUpdated) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  state.message,
                  style: const TextStyle(fontFamily: 'Heebo'),
                ),
                backgroundColor: AppColors.success,
                behavior: SnackBarBehavior.floating,
              ),
            );
            // Reload event detail to get updated RSVP count.
            context
                .read<EventsBloc>()
                .add(LoadEventDetail(id: widget.eventId));
          }
          if (state is EventsError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  state.message,
                  style: const TextStyle(fontFamily: 'Heebo'),
                ),
                backgroundColor: AppColors.breakingRed,
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is EventsLoading || state is EventsInitial) {
            return _buildLoadingState(context);
          }

          if (state is EventsError) {
            return Scaffold(
              appBar: AppBar(
                leading: IconButton(
                  icon: const Icon(Icons.arrow_forward),
                  onPressed: () => context.pop(),
                ),
              ),
              body: ErrorView(
                message: state.message,
                onRetry: () => context
                    .read<EventsBloc>()
                    .add(LoadEventDetail(id: widget.eventId)),
              ),
            );
          }

          if (state is EventDetailLoaded) {
            // Update local RSVP status from server if available.
            if (state.myRsvp != null && _selectedRsvpStatus == null) {
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) {
                  setState(() => _selectedRsvpStatus = state.myRsvp!.status);
                }
              });
            }
            return _buildDetailContent(context, state.event, state.myRsvp);
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return CustomScrollView(
      physics: const NeverScrollableScrollPhysics(),
      slivers: [
        SliverAppBar(
          expandedHeight: 220,
          pinned: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: AppColors.white),
            onPressed: () => context.pop(),
          ),
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [AppColors.likudBlue, AppColors.likudDarkBlue],
                ),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const ShimmerLoading(height: 22, borderRadius: 4),
                const SizedBox(height: 12),
                const ShimmerLoading(width: 200, height: 14, borderRadius: 4),
                const SizedBox(height: 8),
                const ShimmerLoading(width: 160, height: 14, borderRadius: 4),
                const SizedBox(height: 24),
                ...List.generate(
                  5,
                  (_) => const Padding(
                    padding: EdgeInsets.only(bottom: 8),
                    child: ShimmerLoading(height: 14, borderRadius: 4),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDetailContent(
    BuildContext context,
    CampaignEvent event,
    EventRsvp? myRsvp,
  ) {
    final dateFormat = DateFormat('EEEE, d MMMM yyyy', 'he');
    final timeFormat = DateFormat('HH:mm', 'he');

    return CustomScrollView(
      slivers: [
        // Image header with SliverAppBar.
        SliverAppBar(
          expandedHeight: 240,
          pinned: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: AppColors.white),
            onPressed: () => context.pop(),
          ),
          title: Text(
            event.title,
            style: const TextStyle(
              fontFamily: 'Heebo',
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.white,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          centerTitle: true,
          actions: [
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 8),
              child: WhatsAppShareButton(
                contentType: ShareContentType.event,
                contentId: event.id,
                shareText: event.title,
                title: event.title,
                description: event.description,
                imageUrl: event.imageUrl,
              ),
            ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: _buildHeaderImage(event),
          ),
        ),

        // Content body.
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsetsDirectional.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title.
                Text(
                  event.title,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: context.colors.textPrimary,
                    height: 1.3,
                  ),
                  textDirection: TextDirection.rtl,
                ),
                const SizedBox(height: 16),

                // Date & time info card.
                _buildInfoCard(
                  icon: Icons.calendar_today_outlined,
                  label: 'events_date'.tr(),
                  value: dateFormat.format(event.startTime),
                ),
                const SizedBox(height: 8),
                _buildInfoCard(
                  icon: Icons.access_time_outlined,
                  label: 'events_time'.tr(),
                  value: event.endTime != null
                      ? '${timeFormat.format(event.startTime)} - ${timeFormat.format(event.endTime!)}'
                      : timeFormat.format(event.startTime),
                ),
                const SizedBox(height: 8),

                // Location info card with navigate button.
                if (event.location != null && event.location!.isNotEmpty) ...[
                  _buildLocationCard(event),
                  const SizedBox(height: 16),
                ],

                // Description.
                if (event.description != null &&
                    event.description!.isNotEmpty) ...[
                  Text(
                    event.description!,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 15,
                      color: context.colors.textPrimary,
                      height: 1.7,
                    ),
                    textDirection: TextDirection.rtl,
                    textAlign: TextAlign.start,
                  ),
                  const SizedBox(height: 20),
                ],

                // Candidate info card.
                if (event.candidateName != null &&
                    event.candidateName!.isNotEmpty) ...[
                  _buildCandidateCard(event),
                  const SizedBox(height: 20),
                ],

                // RSVP section.
                _buildRsvpSection(event),

                // Bottom padding for floating nav bar.
                const SizedBox(height: 100),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHeaderImage(CampaignEvent event) {
    if (event.imageUrl != null && event.imageUrl!.isNotEmpty) {
      return Stack(
        fit: StackFit.expand,
        children: [
          AppCachedImage(imageUrl: event.imageUrl!, fit: BoxFit.cover),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  AppColors.black.withValues(alpha: 0.2),
                  AppColors.black.withValues(alpha: 0.6),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.likudBlue, AppColors.likudDarkBlue],
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.event,
          size: 64,
          color: AppColors.white,
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsetsDirectional.all(12),
      decoration: BoxDecoration(
        color: context.colors.surfaceVariant,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.colors.border, width: 0.5),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.likudBlue),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 11,
                    color: context.colors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                  textDirection: TextDirection.rtl,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationCard(CampaignEvent event) {
    return Container(
      padding: const EdgeInsetsDirectional.all(12),
      decoration: BoxDecoration(
        color: context.colors.surfaceVariant,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.colors.border, width: 0.5),
      ),
      child: Row(
        children: [
          Icon(Icons.location_on_outlined, size: 20, color: AppColors.likudBlue),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'events_location'.tr(),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 11,
                    color: context.colors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  event.location!,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 14,
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                  textDirection: TextDirection.rtl,
                ),
                if (event.city != null && event.city!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    event.city!,
                    style: TextStyle(
                      fontFamily: 'Heebo',
                      fontSize: 12,
                      color: context.colors.textSecondary,
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                ],
              ],
            ),
          ),
          if (event.hasCoordinates) ...[
            const SizedBox(width: 8),
            FilledButton.tonalIcon(
              onPressed: () =>
                  _openDirections(event.latitude!, event.longitude!),
              icon: const Icon(Icons.directions, size: 18),
              label: Text(
                'events_navigate'.tr(),
                style: const TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.likudBlue.withValues(alpha: 0.12),
                foregroundColor: AppColors.likudBlue,
                padding: const EdgeInsetsDirectional.fromSTEB(12, 6, 12, 6),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCandidateCard(CampaignEvent event) {
    return Container(
      padding: const EdgeInsetsDirectional.all(12),
      decoration: BoxDecoration(
        color: context.colors.surfaceVariant,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: context.colors.border, width: 0.5),
      ),
      child: Row(
        children: [
          // Candidate photo.
          ClipOval(
            child: event.candidatePhotoUrl != null &&
                    event.candidatePhotoUrl!.isNotEmpty
                ? AppCachedImage(
                    imageUrl: event.candidatePhotoUrl!,
                    width: 44,
                    height: 44,
                    fit: BoxFit.cover,
                  )
                : Container(
                    width: 44,
                    height: 44,
                    color: context.colors.surfaceMedium,
                    child: Icon(
                      Icons.person,
                      color: context.colors.textTertiary,
                      size: 24,
                    ),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'events_hosted_by'.tr(),
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 11,
                    color: context.colors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  event.candidateName!,
                  style: TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 15,
                    color: context.colors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                  textDirection: TextDirection.rtl,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRsvpSection(CampaignEvent event) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // RSVP header with count.
        Row(
          children: [
            Text(
              'events_rsvp'.tr(),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: context.colors.textPrimary,
              ),
            ),
            const Spacer(),
            Icon(Icons.people_outline, size: 16, color: AppColors.likudBlue),
            const SizedBox(width: 4),
            Text(
              'events_rsvp_count'.tr(args: [event.rsvpCount.toString()]),
              style: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                color: AppColors.likudBlue,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // RSVP choice chips.
        Row(
          children: [
            Expanded(
              child: _RsvpChoiceChip(
                label: 'events_interested'.tr(),
                icon: Icons.star_outline,
                isSelected: _selectedRsvpStatus == RsvpStatus.interested,
                onTap: () => _onRsvpSelected(RsvpStatus.interested),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _RsvpChoiceChip(
                label: 'events_going'.tr(),
                icon: Icons.check_circle_outline,
                isSelected: _selectedRsvpStatus == RsvpStatus.going,
                onTap: () => _onRsvpSelected(RsvpStatus.going),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _RsvpChoiceChip(
                label: 'events_not_going'.tr(),
                icon: Icons.cancel_outlined,
                isSelected: _selectedRsvpStatus == RsvpStatus.notGoing,
                onTap: () => _onRsvpSelected(RsvpStatus.notGoing),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// RSVP choice chip with icon, label, and selection state.
class _RsvpChoiceChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _RsvpChoiceChip({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected
          ? AppColors.likudBlue.withValues(alpha: 0.12)
          : context.colors.surfaceVariant,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.likudBlue : context.colors.border,
              width: isSelected ? 1.5 : 0.5,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 22,
                color:
                    isSelected ? AppColors.likudBlue : context.colors.textSecondary,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Heebo',
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected
                      ? AppColors.likudBlue
                      : context.colors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
