import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null) {
    try {
      return JSON.stringify(err);
    } catch {
      return '[Non-serializable object]';
    }
  }
  return 'Unknown error';
}

@Injectable()
export class TelegramLauncherService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(TelegramLauncherService.name);
  private isStopping = false;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly configService: ConfigService,
  ) {}

  public onApplicationBootstrap(): void {
    const longPollingEnabled = this.configService.getOrThrow<boolean>(
      'telegram.longPollingEnabled',
    );
    if (!longPollingEnabled) {
      this.logger.log('🤖 Telegram long polling is disabled. Bot will not start polling loop.');
      return;
    }

    this.startPollingWithResilience().catch((err: unknown) => {
      const message = extractErrorMessage(err);
      this.logger.error(`Unexpected failure in startPollingWithResilience: ${message}`);
    });
  }

  public onApplicationShutdown(signal?: string): void {
    this.isStopping = true;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    try {
      this.bot.stop(signal || 'SIGTERM');
      this.logger.log('🤖 Telegram Bot polling stopped cleanly.');
    } catch {
      // ignore errors during shutdown if polling was already stopped
    }
  }

  public async startPollingWithResilience(): Promise<void> {
    if (this.isStopping) return;

    try {
      this.logger.log('🤖 Starting Telegram Bot polling...');
      await this.bot.launch();
      this.logger.log('🤖 Telegram Bot polling completed/stopped.');
    } catch (err: unknown) {
      if (this.isStopping) return;

      const errorMessage = extractErrorMessage(err);
      const isConflict =
        errorMessage.includes('409') ||
        errorMessage.includes('Conflict') ||
        (typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { error_code?: number } }).response?.error_code === 409);

      if (isConflict) {
        this.logger.warn(
          '⚠️ Telegram polling conflict (409 Conflict): Another bot instance is active with the same token. Polling paused. Will retry in 15 seconds...',
        );
        this.scheduleRetry(15000);
      } else {
        this.logger.error(
          `❌ Telegram bot polling encountered an error: ${errorMessage}. Will retry in 10 seconds...`,
        );
        this.scheduleRetry(10000);
      }
    }
  }

  private scheduleRetry(delayMs: number): void {
    if (this.isStopping) return;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      this.startPollingWithResilience().catch((err: unknown) => {
        const message = extractErrorMessage(err);
        this.logger.error(`Error during retry polling: ${message}`);
      });
    }, delayMs);
  }
}
