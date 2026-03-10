import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

export const FIREBASE_ADMIN = 'FIREBASE_ADMIN';

const logger = new Logger('FirebaseAdmin');

export const FirebaseAdminProvider = {
  provide: FIREBASE_ADMIN,
  inject: [ConfigService],
  useFactory: (config: ConfigService): admin.app.App | null => {
    const projectId = config.get<string>('firebase.projectId');
    const privateKey = config.get<string>('firebase.privateKey');
    const clientEmail = config.get<string>('firebase.clientEmail');

    if (!projectId || !privateKey || !clientEmail) {
      logger.warn(
        'Firebase credentials not configured — push notifications disabled',
      );
      return null;
    }

    if (admin.apps.length > 0) {
      return admin.app();
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
    });

    // SDK uses HTTP v1 API by default (legacy API was deprecated July 2024)
    logger.log('Firebase Admin SDK initialized (v1 API)');
    return app;
  },
};
