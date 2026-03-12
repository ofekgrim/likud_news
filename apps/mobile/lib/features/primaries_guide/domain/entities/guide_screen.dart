import 'package:flutter/material.dart';

/// Represents a single screen in the primaries guide.
class GuideScreen {
  final int index;
  final String titleKey;
  final String descriptionKey;
  final IconData icon;
  final Color backgroundColor;

  const GuideScreen({
    required this.index,
    required this.titleKey,
    required this.descriptionKey,
    required this.icon,
    required this.backgroundColor,
  });
}
