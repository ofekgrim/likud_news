import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';
import '../../../../core/widgets/error_view.dart';
import '../../../../core/widgets/shimmer_loading.dart';
import '../../domain/entities/campaign_event.dart';
import '../bloc/events_bloc.dart';

/// Campaign events listing page.
///
/// Shows a list of event cards with filter chips for district and
/// upcoming/past filtering. Each card displays the event image, title,
/// date/time, location, and RSVP count.
class EventsPage extends StatefulWidget {
  const EventsPage({super.key});

  @override
  State<EventsPage> createState() => _EventsPageState();
}

class _EventsPageState extends State<EventsPage> {
  final ScrollController _scrollController = ScrollController();

  /// Whether the "upcoming" filter chip is active.
  bool _showUpcoming = true;

  /// Selected district filter (null = all districts).
  String? _selectedDistrict;

  @override
  void initState() {
    super.initState();
    context.read<EventsBloc>().add(const LoadEvents());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      context.read<EventsBloc>().add(const LoadMoreEvents());
    }
  }

  void _onFilterChanged() {
    context.read<EventsBloc>().add(FilterEvents(
          district: _selectedDistrict,
          upcoming: _showUpcoming ? true : null,
        ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('events_title'.tr()),
        centerTitle: true,
      ),
      body: Column(
        children: [
          _buildFilterBar(),
          Expanded(
            child: BlocBuilder<EventsBloc, EventsState>(
              builder: (context, state) {
                if (state is EventsLoading || state is EventsInitial) {
                  return _buildLoadingState();
                }

                if (state is EventsError) {
                  return ErrorView(
                    message: state.message,
                    onRetry: () =>
                        context.read<EventsBloc>().add(const LoadEvents()),
                  );
                }

                if (state is EventsLoaded) {
                  if (state.events.isEmpty) {
                    return EmptyView(
                      message: 'events_no_events'.tr(),
                      icon: Icons.event_busy_outlined,
                    );
                  }
                  return _buildEventsList(state);
                }

                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 8),
      decoration: BoxDecoration(
        color: AppColors.white,
        border: Border(
          bottom: BorderSide(
            color: AppColors.border,
            width: 0.5,
          ),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            // Upcoming / All filter
            ChoiceChip(
              label: Text('events_upcoming'.tr()),
              selected: _showUpcoming,
              onSelected: (selected) {
                setState(() => _showUpcoming = selected);
                _onFilterChanged();
              },
              selectedColor: AppColors.likudBlue.withValues(alpha: 0.15),
              labelStyle: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                color: _showUpcoming
                    ? AppColors.likudBlue
                    : AppColors.textSecondary,
                fontWeight:
                    _showUpcoming ? FontWeight.w600 : FontWeight.w400,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: _showUpcoming
                      ? AppColors.likudBlue
                      : AppColors.border,
                ),
              ),
              showCheckmark: false,
            ),
            const SizedBox(width: 8),
            // All districts chip
            ChoiceChip(
              label: Text('events_all_districts'.tr()),
              selected: _selectedDistrict == null,
              onSelected: (selected) {
                if (selected) {
                  setState(() => _selectedDistrict = null);
                  _onFilterChanged();
                }
              },
              selectedColor: AppColors.likudBlue.withValues(alpha: 0.15),
              labelStyle: TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                color: _selectedDistrict == null
                    ? AppColors.likudBlue
                    : AppColors.textSecondary,
                fontWeight: _selectedDistrict == null
                    ? FontWeight.w600
                    : FontWeight.w400,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: _selectedDistrict == null
                      ? AppColors.likudBlue
                      : AppColors.border,
                ),
              ),
              showCheckmark: false,
            ),
            const SizedBox(width: 8),
            // Filter icon
            ActionChip(
              avatar: const Icon(
                Icons.filter_list,
                size: 18,
                color: AppColors.textSecondary,
              ),
              label: Text('events_filter'.tr()),
              onPressed: () => _showDistrictFilterSheet(context),
              labelStyle: const TextStyle(
                fontFamily: 'Heebo',
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: AppColors.border),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDistrictFilterSheet(BuildContext context) {
    // Common districts for filtering.
    final districts = [
      'צפון',
      'חיפה',
      'מרכז',
      'תל אביב',
      'ירושלים',
      'דרום',
      'יהודה ושומרון',
    ];

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (bottomSheetContext) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'events_filter'.tr(),
                  style: const TextStyle(
                    fontFamily: 'Heebo',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ChoiceChip(
                      label: Text('events_all_districts'.tr()),
                      selected: _selectedDistrict == null,
                      onSelected: (selected) {
                        setState(() => _selectedDistrict = null);
                        _onFilterChanged();
                        Navigator.pop(bottomSheetContext);
                      },
                      selectedColor:
                          AppColors.likudBlue.withValues(alpha: 0.15),
                      showCheckmark: false,
                    ),
                    ...districts.map((district) {
                      return ChoiceChip(
                        label: Text(district),
                        selected: _selectedDistrict == district,
                        onSelected: (selected) {
                          setState(() => _selectedDistrict =
                              selected ? district : null);
                          _onFilterChanged();
                          Navigator.pop(bottomSheetContext);
                        },
                        selectedColor:
                            AppColors.likudBlue.withValues(alpha: 0.15),
                        showCheckmark: false,
                      );
                    }),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLoadingState() {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 5,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 8),
          child: ShimmerLoading(height: 180, borderRadius: 12),
        );
      },
    );
  }

  Widget _buildEventsList(EventsLoaded state) {
    return RefreshIndicator(
      onRefresh: () async {
        context.read<EventsBloc>().add(const LoadEvents());
      },
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 100),
        itemCount: state.events.length + (state.hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= state.events.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppColors.likudBlue,
                ),
              ),
            );
          }
          return _EventCard(
            event: state.events[index],
            onTap: () {
              context.push('/events/${state.events[index].id}');
            },
          );
        },
      ),
    );
  }
}

/// A card widget displaying a single campaign event.
class _EventCard extends StatelessWidget {
  final CampaignEvent event;
  final VoidCallback onTap;

  const _EventCard({required this.event, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('EEEE, d MMMM yyyy', 'he');
    final timeFormat = DateFormat('HH:mm', 'he');

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(12),
        elevation: 1,
        shadowColor: AppColors.black.withValues(alpha: 0.08),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Event image.
              if (event.imageUrl != null && event.imageUrl!.isNotEmpty)
                ClipRRect(
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(12)),
                  child: AppCachedImage(
                    imageUrl: event.imageUrl!,
                    height: 160,
                    fit: BoxFit.cover,
                  ),
                ),

              Padding(
                padding: const EdgeInsetsDirectional.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title.
                    Text(
                      event.title,
                      style: const TextStyle(
                        fontFamily: 'Heebo',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      textDirection: TextDirection.rtl,
                    ),
                    const SizedBox(height: 8),

                    // Date & time row.
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_today_outlined,
                          size: 14,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            '${dateFormat.format(event.startTime)} ${timeFormat.format(event.startTime)}',
                            style: const TextStyle(
                              fontFamily: 'Heebo',
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                            textDirection: TextDirection.rtl,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),

                    // Location row.
                    if (event.location != null &&
                        event.location!.isNotEmpty) ...[
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              event.location!,
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                              textDirection: TextDirection.rtl,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                    ],

                    // Bottom row: RSVP count + upcoming badge.
                    Row(
                      children: [
                        // RSVP count.
                        Icon(
                          Icons.people_outline,
                          size: 14,
                          color: AppColors.likudBlue,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'events_rsvp_count'.tr(args: [
                            event.rsvpCount.toString(),
                          ]),
                          style: TextStyle(
                            fontFamily: 'Heebo',
                            fontSize: 12,
                            color: AppColors.likudBlue,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const Spacer(),
                        // Upcoming badge.
                        if (event.isUpcoming)
                          Container(
                            padding: const EdgeInsetsDirectional.fromSTEB(
                                8, 2, 8, 2),
                            decoration: BoxDecoration(
                              color:
                                  AppColors.likudBlue.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'events_upcoming'.tr(),
                              style: TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 10,
                                color: AppColors.likudBlue,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          )
                        else
                          Container(
                            padding: const EdgeInsetsDirectional.fromSTEB(
                                8, 2, 8, 2),
                            decoration: BoxDecoration(
                              color: AppColors.textSecondary
                                  .withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'events_past'.tr(),
                              style: const TextStyle(
                                fontFamily: 'Heebo',
                                fontSize: 10,
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
