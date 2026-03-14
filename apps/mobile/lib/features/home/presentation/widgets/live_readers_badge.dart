import 'dart:async';

import 'package:easy_localization/easy_localization.dart' hide TextDirection;
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';

import '../../../../app/theme/theme_context.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';

/// Displays a "X readers now" badge above the feed.
/// Polls the backend every 60 seconds.
class LiveReadersBadge extends StatefulWidget {
  const LiveReadersBadge({super.key});

  @override
  State<LiveReadersBadge> createState() => _LiveReadersBadgeState();
}

class _LiveReadersBadgeState extends State<LiveReadersBadge> {
  int _count = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _fetchCount();
    _timer = Timer.periodic(const Duration(seconds: 60), (_) => _fetchCount());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetchCount() async {
    try {
      final response = await GetIt.I<ApiClient>().get(
        ApiConstants.articleAnalyticsLiveReaders,
      );
      final data = response.data;
      if (data is Map<String, dynamic> && mounted) {
        setState(() {
          _count = (data['count'] as num?)?.toInt() ?? 0;
        });
      }
    } catch (_) {
      // Silently ignore — badge just won't update
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_count < 2) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: Colors.red,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            '$_count ${'readers_now'.tr()}',
            style: TextStyle(
              fontFamily: 'Heebo',
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: context.colors.textTertiary,
            ),
          ),
        ],
      ),
    );
  }
}
