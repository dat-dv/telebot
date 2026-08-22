import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
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

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3000);
  const appUrl = configService.get<string>('appUrl', 'http://localhost:3000');

  await app.listen(port);

  logger.log(`🚀 Web Server is listening on port ${port}`);
  logger.log(`🌐 Public OAuth Callback URL: ${appUrl}/oauth2callback`);
  logger.log('🤖 Listening for messages and commands on Telegram (Long Polling)...');
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Fatal error starting application', err);
  process.exit(1);
});
