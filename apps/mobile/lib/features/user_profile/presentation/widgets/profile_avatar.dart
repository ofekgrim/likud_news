import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/widgets/cached_image.dart';

/// Circular avatar widget for the user profile.
///
/// Displays the user's image via [AppCachedImage] if [imageUrl] is provided,
/// or falls back to showing the user's initials from [displayName].
/// In edit mode, an overlay camera icon is shown for changing the avatar.
class ProfileAvatar extends StatelessWidget {
  final String? imageUrl;
  final String? displayName;
  final double radius;
  final bool showEditOverlay;
  final VoidCallback? onEditTap;

  const ProfileAvatar({
    super.key,
    this.imageUrl,
    this.displayName,
    this.radius = 50,
    this.showEditOverlay = false,
    this.onEditTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: showEditOverlay ? onEditTap : null,
      child: Stack(
        children: [
          // Avatar circle.
          Container(
            width: radius * 2,
            height: radius * 2,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: AppColors.black.withValues(alpha: 0.12),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: ClipOval(
              child: _buildAvatarContent(),
            ),
          ),

          // Edit overlay (camera icon).
          if (showEditOverlay)
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: radius * 0.6,
                height: radius * 0.6,
                decoration: BoxDecoration(
                  color: AppColors.likudBlue,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.black.withValues(alpha: 0.15),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Icon(
                  Icons.camera_alt,
                  color: AppColors.white,
                  size: radius * 0.3,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildAvatarContent() {
    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return AppCachedImage(
        imageUrl: imageUrl!,
        width: radius * 2,
        height: radius * 2,
        fit: BoxFit.cover,
      );
    }

    // Initials fallback.
    return Container(
      width: radius * 2,
      height: radius * 2,
      color: AppColors.likudLightBlue,
      child: Center(
        child: Text(
          _getInitials(),
          style: TextStyle(
            fontFamily: 'Heebo',
            fontSize: radius * 0.6,
            fontWeight: FontWeight.w700,
            color: AppColors.likudBlue,
          ),
        ),
      ),
    );
  }

  /// Extracts up to two initials from the display name.
  String _getInitials() {
    if (displayName == null || displayName!.isEmpty) {
      return '?';
    }
    final parts = displayName!.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
}
