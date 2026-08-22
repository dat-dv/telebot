import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.createApplicationContext(AppModule);

  app.enableShutdownHooks();

  logger.log('🚀 Telegram Assistant Bot has been successfully initialized and started!');
  logger.log('🤖 Listening for messages and commands on Telegram...');
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Fatal error starting application', err);
  process.exit(1);
});
