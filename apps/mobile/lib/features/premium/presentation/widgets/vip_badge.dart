import 'package:flutter/material.dart';

/// A gold VIP premium badge for the user's profile.
///
/// Displays a small gold "VIP" badge with a star icon.
class VipBadge extends StatelessWidget {
  final double size;

  const VipBadge({
    super.key,
    this.size = 24,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsetsDirectional.symmetric(
        horizontal: size * 0.35,
        vertical: size * 0.15,
      ),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFD700), Color(0xFFFFA500)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(size * 0.3),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFFD700).withValues(alpha: 0.3),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.star,
            color: Colors.white,
            size: size * 0.6,
          ),
          SizedBox(width: size * 0.1),
          Text(
            'VIP',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: size * 0.5,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
