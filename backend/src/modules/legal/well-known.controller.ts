import { Controller, Get, Header } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

/**
 * Serves Apple App Site Association and Android Asset Links for deep linking.
 *
 * These files must be served at the root path (/.well-known/...) without
 * the /api/v1/ global prefix, which is why they are excluded in main.ts.
 *
 * ⚠️  Before going to production, replace the placeholders below:
 *    - APPLE_TEAM_ID  → Your 10-char Apple Developer Team ID (App Store Connect → Membership)
 *    - SHA256_CERT_FINGERPRINT → SHA-256 fingerprint of your Android signing keystore
 *      Run: keytool -list -v -keystore your.keystore | grep SHA256
 */
@Controller('.well-known')
@SkipThrottle()
export class WellKnownController {
  /**
   * iOS Universal Links verification file.
   * Tells iOS that this domain is associated with the app.
   */
  @Get('apple-app-site-association')
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'public, max-age=3600')
  appleAppSiteAssociation(): object {
    return {
      applinks: {
        apps: [],
        details: [
          {
            appID: 'APPLE_TEAM_ID.com.likud.news.metzudatHalikud',
            paths: ['/articles/*', '/candidates/*', '/elections/*', '/events/*'],
          },
        ],
      },
    };
  }

  /**
   * Android App Links verification file.
   * Tells Android that this domain is associated with the app.
   */
  @Get('assetlinks.json')
  @Header('Content-Type', 'application/json')
  @Header('Cache-Control', 'public, max-age=3600')
  assetLinks(): object[] {
    return [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.likud.news.metzudat_halikud',
          sha256_cert_fingerprints: [
            'SHA256_CERT_FINGERPRINT',
          ],
        },
      },
    ];
  }
}
