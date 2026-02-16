import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html/flutter_widget_from_html.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/theme/app_colors.dart';

/// Renders the article body from HTML content.
///
/// Uses `flutter_widget_from_html` to convert the HTML string
/// into Flutter widgets with RTL-aware styling.
class ArticleContent extends StatelessWidget {
  final String htmlContent;

  const ArticleContent({super.key, required this.htmlContent});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (htmlContent.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Center(
          child: Text(
            'אין תוכן להצגה',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: AppColors.textTertiary,
            ),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: HtmlWidget(
        htmlContent,
        textStyle: theme.textTheme.bodyLarge?.copyWith(
          color: AppColors.textPrimary,
          height: 1.8,
          fontSize: 17,
        ),
        customStylesBuilder: (element) {
          switch (element.localName) {
            case 'h1':
              return {
                'font-size': '24px',
                'font-weight': '800',
                'margin-top': '20px',
                'margin-bottom': '10px',
              };
            case 'h2':
              return {
                'font-size': '21px',
                'font-weight': '700',
                'margin-top': '18px',
                'margin-bottom': '8px',
              };
            case 'h3':
              return {
                'font-size': '18px',
                'font-weight': '700',
                'margin-top': '16px',
                'margin-bottom': '6px',
              };
            case 'blockquote':
              return {
                'border-right': '4px solid #0099DB',
                'padding-right': '12px',
                'margin-right': '0px',
                'color': '#64748B',
                'font-style': 'italic',
              };
            case 'a':
              return {
                'color': '#0099DB',
                'text-decoration': 'underline',
              };
            default:
              return null;
          }
        },
        onTapUrl: (url) {
          launchUrl(
            Uri.parse(url),
            mode: LaunchMode.externalApplication,
          );
          return true;
        },
      ),
    );
  }
}
