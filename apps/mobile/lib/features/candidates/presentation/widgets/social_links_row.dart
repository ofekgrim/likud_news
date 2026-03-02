import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';

/// Row of social media icon buttons for a candidate.
///
/// Only renders icons for social links that exist in the [socialLinks] map.
/// Supported keys: twitter, facebook, instagram, website.
/// Opens URLs via [url_launcher].
class SocialLinksRow extends StatelessWidget {
  final Map<String, String> socialLinks;

  const SocialLinksRow({
    super.key,
    required this.socialLinks,
  });

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasTwitter = socialLinks.containsKey('twitter') &&
        socialLinks['twitter']!.isNotEmpty;
    final hasFacebook = socialLinks.containsKey('facebook') &&
        socialLinks['facebook']!.isNotEmpty;
    final hasInstagram = socialLinks.containsKey('instagram') &&
        socialLinks['instagram']!.isNotEmpty;
    final hasWebsite = socialLinks.containsKey('website') &&
        socialLinks['website']!.isNotEmpty;

    if (!hasTwitter && !hasFacebook && !hasInstagram && !hasWebsite) {
      return const SizedBox.shrink();
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (hasFacebook)
          _SocialIconButton(
            icon: Icons.facebook,
            color: const Color(0xFF1877F2),
            onTap: () => _launchUrl(socialLinks['facebook']!),
          ),
        if (hasTwitter) ...[
          if (hasFacebook) const SizedBox(width: 12),
          _SocialIconButton(
            icon: Icons.alternate_email,
            color: const Color(0xFF1DA1F2),
            onTap: () => _launchUrl(socialLinks['twitter']!),
          ),
        ],
        if (hasInstagram) ...[
          if (hasFacebook || hasTwitter) const SizedBox(width: 12),
          _SocialIconButton(
            icon: Icons.camera_alt_outlined,
            color: const Color(0xFFE4405F),
            onTap: () => _launchUrl(socialLinks['instagram']!),
          ),
        ],
        if (hasWebsite) ...[
          if (hasFacebook || hasTwitter || hasInstagram)
            const SizedBox(width: 12),
          _SocialIconButton(
            icon: Icons.language,
            color: AppColors.likudBlue,
            onTap: () => _launchUrl(socialLinks['website']!),
          ),
        ],
      ],
    );
  }
}

/// Social media icon button.
class _SocialIconButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _SocialIconButton({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Icon(icon, color: color, size: 28),
      ),
    );
  }
}
