import { NestFactory } from '@nestjs/core';
import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { validateEnvironment, printEnvValidationBanner } from './config/env.validator';

async function bootstrap() {
  // 1. Strict Fail-Fast Environment Validation
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
  const port = configService.get<number>('port', 3000);
  const appUrl = configService.get<string>('appUrl', 'http://localhost:3000');
  const webOrigin = configService.get<string>('webOrigin', '');
  const longPollingEnabled = configService.get<boolean>('telegram.longPollingEnabled', true);

  const corsOrigins = [webOrigin];
  if (process.env.NODE_ENV !== 'production') corsOrigins.push('http://localhost:5173');
  if (corsOrigins.some(Boolean)) {
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

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Fatal error starting application', err);
  process.exit(1);
});
