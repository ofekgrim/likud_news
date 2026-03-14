import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import * as path from 'path';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

// Initialize Sentry before anything else so it can capture startup errors
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.2,
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Use NestJS built-in logger (timestamps + context labels)
    logger: ['log', 'error', 'warn', 'debug'],
  });
  const config = app.get(ConfigService);

  // Global prefix (exclude /.well-known/* for deep link verification files)
  const apiPrefix = config.get<string>('apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix, {
    exclude: [{ path: '.well-known/(.*)', method: RequestMethod.GET }],
  });

  // CORS (must be before helmet)
  const nodeEnv = config.get<string>('nodeEnv', 'development');
  if (nodeEnv === 'development') {
    app.enableCors({
      origin: true,
      credentials: true,
    });
  } else {
    const corsOrigins = config.get<string[]>('cors.origins', [
      'http://localhost:3001',
      'https://admin.metzudathalikud.co.il',
    ]);
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
    });
  }

  // Security
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));
  app.use(compression());

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Logging & error handling ─────────────────────────────
  // HTTP request logger (all environments — light overhead)
  app.useGlobalInterceptors(new LoggingInterceptor());
  // Global exception filter (readable errors + consistent response shape)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger API Docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Metzudat HaLikud API')
    .setDescription('News platform API for the Metzudat HaLikud app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  // Serve uploaded files locally (dev mode)
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Start server
  const port = config.get<number>('port', 9090);
  await app.listen(port);

  // ── Startup banner ───────────────────────────────────────
  const b = '\x1b[36m'; // cyan
  const r = '\x1b[0m';  // reset
  const d = '\x1b[2m';  // dim
  console.log('');
  console.log(`${b}  ╔══════════════════════════════════════════╗${r}`);
  console.log(`${b}  ║${r}  ${b}Metzudat HaLikud API${r}                    ${b}║${r}`);
  console.log(`${b}  ╠══════════════════════════════════════════╣${r}`);
  console.log(`${b}  ║${r}  Server   ${d}http://localhost:${port}/${apiPrefix}${r}  ${b}║${r}`);
  console.log(`${b}  ║${r}  Swagger  ${d}http://localhost:${port}/${apiPrefix}/docs${r} ${b}║${r}`);
  console.log(`${b}  ║${r}  Mode     ${d}${nodeEnv}${r}                     ${b}║${r}`);
  console.log(`${b}  ╚══════════════════════════════════════════╝${r}`);
  console.log('');
}
void bootstrap();
