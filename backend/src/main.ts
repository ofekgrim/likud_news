import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Global prefix
  const apiPrefix = config.get<string>('apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

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
      'http://localhost:6001',
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
  const port = config.get<number>('port', 6000);
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}/${apiPrefix}`);
  console.log(`Swagger docs at http://localhost:${port}/${apiPrefix}/docs`);
}
void bootstrap();
