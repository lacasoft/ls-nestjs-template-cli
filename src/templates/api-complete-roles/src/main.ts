import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Security Headers with Helmet
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for Swagger UI
          styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for Swagger UI
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      // X-Frame-Options
      frameguard: {
        action: 'deny',
      },
      // X-Content-Type-Options
      noSniff: true,
      // X-XSS-Protection (legacy but still useful for older browsers)
      xssFilter: true,
      // Referrer-Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      // X-Download-Options for IE8+
      ieNoOpen: true,
      // X-DNS-Prefetch-Control
      dnsPrefetchControl: {
        allow: false,
      },
    }),
  );

  // CORS Configuration
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS', '');
  const originsArray = allowedOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: (origin, callback) => {
      // Only allow no-origin in development (for tools like Postman, curl)
      if (!origin) {
        if (process.env.NODE_ENV === 'development') {
          logger.warn('CORS: Allowing request with no origin header (development mode)');
          return callback(null, true);
        }

        // In production, require origin header
        // Requests without origin should use API key authentication
        logger.warn('CORS: Rejected request with no origin header (production mode)');
        return callback(new Error('Origin header required in production'));
      }

      if (originsArray.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS: Rejected request from unauthorized origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
      'x-api-secret',
      'x-refresh-token',
    ],
  });

  // Validation & Sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
    new SanitizePipe(), // Sanitize after validation
  );

  // Serialization
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('{{projectName}} API')
    .setDescription('{{projectDescription}}')
    .setVersion('{{version}}')
    .setContact('{{author}}', '', '')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .addApiKey({ type: 'apiKey', name: 'x-api-secret', in: 'header' }, 'api-secret')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('app.port');
  await app.listen(port).then(() => {
    logger.log(`============================================`);
    logger.log(`  NAME: ${configService.get('app.name') || 'DefaultAppName'}`);
    logger.log(`  HTTP PORT: ${port}`);
    logger.log(`  SWAGGER: http://localhost:${port}/api`);
    logger.log(`============================================`);
  });
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Error during application bootstrap', err.stack);
});
