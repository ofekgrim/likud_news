import 'dart:ui';

import 'package:flutter/material.dart';

/// A reusable widget that provides the Liquid Glass effect.
///
/// This widget creates a frosted glass appearance using backdrop blur
/// with a semi-transparent background, similar to Apple's Liquid Glass design.
class LiquidGlassContainer extends StatelessWidget {
  /// The child widget to display inside the container.
  final Widget child;

  /// The border radius of the container.
  final double borderRadius;

  /// The blur sigma value for the backdrop filter.
  /// Higher values create more blur. Default is 15.
  final double blurSigma;

  /// The background color of the container.
  /// Default is white.
  final Color backgroundColor;

  /// The opacity of the background color.
  /// Default is 0.25 for a subtle glass effect.
  final double backgroundOpacity;

  /// Optional border for the container.
  final Border? border;

  /// Optional padding inside the container.
  final EdgeInsets? padding;

  /// Optional margin outside the container.
  final EdgeInsets? margin;

  /// The height of the container. If null, it will size to fit its child.
  final double? height;

  /// The width of the container. If null, it will size to fit its child.
  final double? width;

  /// Optional box shadow for the container.
  final List<BoxShadow>? boxShadow;

  const LiquidGlassContainer({
    super.key,
    required this.child,
    this.borderRadius = 20,
    this.blurSigma = 15,
    this.backgroundColor = Colors.white,
    this.backgroundOpacity = 0.25,
    this.border,
    this.padding,
    this.margin,
    this.height,
    this.width,
    this.boxShadow,
  });

  /// Creates a LiquidGlassContainer with a light appearance.
  factory LiquidGlassContainer.light({
    Key? key,
    required Widget child,
    double borderRadius = 20,
    double blurSigma = 15,
    Border? border,
    EdgeInsets? padding,
    EdgeInsets? margin,
    double? height,
    double? width,
  }) {
    return LiquidGlassContainer(
      key: key,
      borderRadius: borderRadius,
      blurSigma: blurSigma,
      backgroundColor: Colors.white,
      backgroundOpacity: 0.3,
      border: border,
      padding: padding,
      margin: margin,
      height: height,
      width: width,
      child: child,
    );
  }

  /// Creates a LiquidGlassContainer with a dark appearance.
  factory LiquidGlassContainer.dark({
    Key? key,
    required Widget child,
    double borderRadius = 20,
    double blurSigma = 15,
    Border? border,
    EdgeInsets? padding,
    EdgeInsets? margin,
    double? height,
    double? width,
  }) {
    return LiquidGlassContainer(
      key: key,
      borderRadius: borderRadius,
      blurSigma: blurSigma,
      backgroundColor: Colors.black,
      backgroundOpacity: 0.2,
      border: border,
      padding: padding,
      margin: margin,
      height: height,
      width: width,
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      height: height,
      width: width,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: boxShadow,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
          child: Container(
            padding: padding,
            decoration: BoxDecoration(
              color: backgroundColor.withValues(alpha: backgroundOpacity),
              borderRadius: BorderRadius.circular(borderRadius),
              border: border,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

/// A tab item for use within a LiquidGlassTabBar.
class LiquidGlassTab extends StatelessWidget {
  /// The label text for the tab.
  final String label;

  /// Whether this tab is currently selected.
  final bool isSelected;

  /// Callback when the tab is tapped.
  final VoidCallback? onTap;

  /// The color of the selected tab background.
  final Color selectedColor;

  /// The text color when selected.
  final Color selectedTextColor;

  /// The text color when not selected.
  final Color unselectedTextColor;

  /// Padding for the tab content.
  final EdgeInsets padding;

  /// Border radius for the selected tab indicator.
  final double borderRadius;

  const LiquidGlassTab({
    super.key,
    required this.label,
    required this.isSelected,
    this.onTap,
    this.selectedColor = Colors.white,
    this.selectedTextColor = const Color(0xFFF16B6A),
    this.unselectedTextColor = Colors.white,
    this.padding = const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
    this.borderRadius = 20,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: padding,
        decoration: BoxDecoration(
          color: isSelected ? selectedColor : Colors.transparent,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: 'Rubik',
            fontWeight: FontWeight.w600,
            fontSize: 14,
            color: isSelected ? selectedTextColor : unselectedTextColor,
          ),
        ),
      ),
    );
  }
}

/// A tab bar with Liquid Glass effect.
class LiquidGlassTabBar extends StatelessWidget {
  /// The list of tabs to display.
  final List<Widget> tabs;

  /// Optional leading widget (like an add button).
  final Widget? leading;

  /// Border radius of the container.
  final double borderRadius;

  /// Padding inside the container.
  final EdgeInsets padding;

  /// The blur sigma for the glass effect.
  final double blurSigma;

  /// Background opacity.
  final double backgroundOpacity;

  const LiquidGlassTabBar({
    super.key,
    required this.tabs,
    this.leading,
    this.borderRadius = 25,
    this.padding = const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
    this.blurSigma = 15,
    this.backgroundOpacity = 0.25,
  });

  @override
  Widget build(BuildContext context) {
    return LiquidGlassContainer(
      borderRadius: borderRadius,
      blurSigma: blurSigma,
      backgroundOpacity: backgroundOpacity,
      padding: padding,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (leading != null) ...[
            leading!,
            const SizedBox(width: 4),
          ],
          ...tabs,
        ],
      ),
    );
  }
}
