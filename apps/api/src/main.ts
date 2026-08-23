import { NestFactory } from '@nestjs/core';
import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import {
  loadEnvironment,
  validateEnvironment,
  printEnvValidationBanner,
} from './config/env.validator';

async function bootstrap() {
  // 1. Strict Fail-Fast Environment Validation
  loadEnvironment();
  const validation = validateEnvironment();
  if (!validation.isValid) {
    printEnvValidationBanner(validation.errors);
    process.exit(1);
  }

  // 2. Initialize NestJS Application
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'oauth2callback', method: RequestMethod.ALL },
      { path: 'auth/google/callback', method: RequestMethod.ALL },
      { path: 'callback', method: RequestMethod.ALL },
    ],
  });

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('port');
  const appUrl = configService.getOrThrow<string>('appUrl');
  const webOrigin = configService.getOrThrow<string>('webOrigin');
  const corsAllowAll = configService.getOrThrow<boolean>('cors.allowAll');
  const longPollingEnabled = configService.getOrThrow<boolean>('telegram.longPollingEnabled');

  const corsOrigins = [webOrigin];
  if (process.env.NODE_ENV !== 'production') corsOrigins.push('http://localhost:5173');
  if (corsAllowAll) {
    app.enableCors({ origin: true, credentials: true });
  } else if (corsOrigins.some(Boolean)) {
    app.enableCors({ origin: corsOrigins.filter(Boolean), credentials: true });
  }

  await app.listen(port);

  logger.log(`🚀 Web Server is listening on port ${port}`);
  logger.log(`🌐 Public OAuth Callback URL: ${appUrl}/oauth2callback`);
  logger.log(
    longPollingEnabled
      ? '🤖 Listening for messages and commands on Telegram (Long Polling)...'
      : '🤖 Telegram long polling is disabled; this API instance can still send outbound messages.',
  );
}

// Global Process Resilience Guards
process.on('unhandledRejection', (reason: unknown) => {
  const logger = new Logger('UnhandledRejection');
  let message = 'Unknown rejection';
  if (reason instanceof Error) {
    message = reason.stack || reason.message;
  } else if (typeof reason === 'string') {
    message = reason;
  } else if (typeof reason === 'object' && reason !== null) {
    try {
      message = JSON.stringify(reason);
    } catch {
      message = '[Non-serializable object]';
    }
  }
  logger.error(`Unhandled Promise Rejection trapped: ${message}`);
});

process.on('uncaughtException', (error: Error) => {
  const logger = new Logger('UncaughtException');
  logger.error(`Uncaught Exception trapped: ${error.stack || error.message}`);
});

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Fatal error starting application', err);
  process.exit(1);
});
