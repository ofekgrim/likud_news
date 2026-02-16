import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Global prefix
  const apiPrefix = config.get<string>('apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  const corsOrigins = config.get<string[]>('cors.origins', [
    'http://localhost:3001',
  ]);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

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

  // Start server
  const port = config.get<number>('port', 3000);
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}/${apiPrefix}`);
  console.log(
    `Swagger docs at http://localhost:${port}/${apiPrefix}/docs`,
  );
}
bootstrap();
