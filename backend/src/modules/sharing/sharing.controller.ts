import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SharingService } from './sharing.service';
import { CreateShareLinkDto } from './dto/create-share-link.dto';

@ApiTags('Sharing')
@Controller('sharing')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Post('create-link')
  @ApiOperation({ summary: 'Create a share link with OG metadata' })
  @ApiResponse({ status: 201, description: 'Share link created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createLink(@Body() dto: CreateShareLinkDto) {
    const shareLink = await this.sharingService.createLink(dto);
    return {
      data: {
        id: shareLink.id,
        shortCode: shareLink.shortCode,
        contentType: shareLink.contentType,
        contentId: shareLink.contentId,
        ogTitle: shareLink.ogTitle,
        ogDescription: shareLink.ogDescription,
        ogImageUrl: shareLink.ogImageUrl,
        createdAt: shareLink.createdAt,
      },
    };
  }

  @Get('resolve/:shortCode')
  @ApiOperation({
    summary: 'Resolve a short code, increment click count, return content info',
  })
  @ApiParam({
    name: 'shortCode',
    description: '8-character alphanumeric short code',
  })
  @ApiResponse({ status: 200, description: 'Share link resolved successfully' })
  @ApiResponse({ status: 404, description: 'Share link not found' })
  async resolveShortCode(@Param('shortCode') shortCode: string) {
    const shareLink = await this.sharingService.resolveShortCode(shortCode);
    return {
      data: {
        contentType: shareLink.contentType,
        contentId: shareLink.contentId,
        ogTitle: shareLink.ogTitle,
        ogDescription: shareLink.ogDescription,
        ogImageUrl: shareLink.ogImageUrl,
        utmSource: shareLink.utmSource,
        utmMedium: shareLink.utmMedium,
        utmCampaign: shareLink.utmCampaign,
      },
    };
  }

  @Get('og/:shortCode')
  @ApiOperation({
    summary:
      'Return HTML page with OG meta tags for WhatsApp/social link previews',
  })
  @ApiParam({
    name: 'shortCode',
    description: '8-character alphanumeric short code',
  })
  @ApiResponse({
    status: 200,
    description: 'HTML page with OG meta tags',
  })
  @ApiResponse({ status: 404, description: 'Share link not found' })
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getOgPage(@Param('shortCode') shortCode: string): Promise<string> {
    const shareLink = await this.sharingService.getByShortCode(shortCode);

    const title = this.escapeHtml(shareLink.ogTitle || 'מצודת הליכוד');
    const description = this.escapeHtml(
      shareLink.ogDescription || 'חדשות ועדכונים מהליכוד',
    );
    const imageUrl = shareLink.ogImageUrl
      ? this.escapeHtml(shareLink.ogImageUrl)
      : '';

    // Build query params for the deep link
    const queryParts: string[] = [];
    if (shareLink.utmSource) queryParts.push(`utm_source=${encodeURIComponent(shareLink.utmSource)}`);
    if (shareLink.utmMedium) queryParts.push(`utm_medium=${encodeURIComponent(shareLink.utmMedium)}`);
    if (shareLink.utmCampaign) queryParts.push(`utm_campaign=${encodeURIComponent(shareLink.utmCampaign)}`);
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    // Deep link URL that the app can intercept
    const deepLinkUrl = `metzudat://share/${shareLink.contentType}/${shareLink.contentId}${queryString}`;

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>

  <!-- Open Graph Meta Tags -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ''}
  <meta property="og:site_name" content="מצודת הליכוד" />
  <meta property="og:locale" content="he_IL" />

  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}" />` : ''}

  <!-- App Deep Link -->
  <meta http-equiv="refresh" content="2;url=${deepLinkUrl}" />

  <style>
    body {
      font-family: 'Heebo', Arial, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      direction: rtl;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 32px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    }
    .brand { color: #0099DB; font-size: 24px; font-weight: 700; margin-bottom: 16px; }
    .title { font-size: 18px; color: #333; margin-bottom: 8px; }
    .desc { font-size: 14px; color: #666; margin-bottom: 24px; }
    .loading { color: #999; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">מצודת הליכוד</div>
    <div class="title">${title}</div>
    <div class="desc">${description}</div>
    <div class="loading">מעביר אותך לאפליקציה...</div>
  </div>

  <script>
    // Try to open the app via deep link immediately
    window.location.href = '${deepLinkUrl}';
  </script>
</body>
</html>`;
  }

  /**
   * Escape HTML special characters to prevent XSS in OG page.
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
