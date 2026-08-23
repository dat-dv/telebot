import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';

@Injectable()
export class TelegramCallerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramCallerService.name);
  private client: TelegramClient | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  public async onModuleInit(): Promise<void> {
    const rawApiId = this.configService.get<string>('telegram.apiId');
    const apiHash = this.configService.get<string>('telegram.apiHash');
    const sessionStr = this.configService.get<string>('telegram.session');

    if (!rawApiId || !apiHash || !sessionStr) {
      this.logger.log(
        'GramJS credentials (TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION) not provided. Voice Flash Calls will automatically fallback to Telegram text messages.',
      );
      return;
    }

    const apiId = Number(rawApiId);
    if (isNaN(apiId)) {
      this.logger.warn(`Invalid TELEGRAM_API_ID: ${rawApiId}`);
      return;
    }

    try {
      const session = new StringSession(sessionStr.trim());
      this.client = new TelegramClient(session, apiId, apiHash.trim(), {
        connectionRetries: 3,
      });

      await this.client.connect();
      this.isConnected = true;
      this.logger.log('GramJS MTProto Client successfully connected and ready for Flash Calls! 📞');
    } catch (err) {
      const error = err as Error;
      this.logger.warn(`Could not initialize GramJS Client: ${error.message}`);
      if (this.client) {
        try {
          await this.client.disconnect();
        } catch {
          // ignore cleanup errors
        }
      }
      this.client = null;
      this.isConnected = false;
    }
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.disconnect();
        this.logger.log('GramJS Client disconnected cleanly.');
      } catch {
        // ignore
      }
    }
  }

  public isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Executes a Flash Call (VoIP Call) to the target Telegram User ID,
   * rings the user's phone for `ringDurationMs` (default 12s) to wake them up,
   * and automatically discards the call.
   */
  public async makeFlashCall(
    targetUserId: number | string,
    ringDurationMs = 12000,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.client || !this.isConnected) {
      return {
        success: false,
        error: 'GramJS client is not configured or connected.',
      };
    }

    try {
      this.logger.log(`Initiating GramJS Flash Call to Telegram User ${targetUserId}...`);

      const inputUser = await this.client.getInputEntity(targetUserId.toString());
      const gA = Buffer.alloc(256);
      for (let i = 0; i < gA.length; i++) gA[i] = Math.floor(Math.random() * 256);

      const _dhConfig = await this.client.invoke(
        new Api.messages.GetDhConfig({
          version: 0,
          randomLength: 256,
        }),
      );

      const randomId = Math.floor(Math.random() * 1000000000);

      // Request VoIP call
      const callResult = await this.client.invoke(
        new Api.phone.RequestCall({
          userId: inputUser,
          randomId,
          gAHash: Buffer.alloc(32),
          protocol: new Api.PhoneCallProtocol({
            minLayer: 65,
            maxLayer: 92,
            udpP2p: true,
            udpReflector: true,
            libraryVersions: ['1.14.0'],
          }),
        }),
      );

      const phoneCall = (callResult as { phoneCall?: Api.TypePhoneCall }).phoneCall;
      const callId = phoneCall && 'id' in phoneCall ? phoneCall.id : undefined;
      const accessHash = phoneCall && 'accessHash' in phoneCall ? phoneCall.accessHash : undefined;

      this.logger.log(
        `Flash Call ringing target user ${targetUserId}. Waiting ${ringDurationMs / 1000}s...`,
      );

      // Ring for specified duration then discard (nhá máy)
      await new Promise((resolve) => setTimeout(resolve, ringDurationMs));

      if (callId && accessHash) {
        await this.client.invoke(
          new Api.phone.DiscardCall({
            peer: new Api.InputPhoneCall({
              id: callId,
              accessHash,
            }),
            duration: 0,
            reason: new Api.PhoneCallDiscardReasonMissed(),
            connectionId: BigInt(0) as unknown as Api.long,
          }),
        );
        this.logger.log(`Flash Call to user ${targetUserId} completed and discarded successfully.`);
      }

      return { success: true };
    } catch (err) {
      const error = err as Error;
      this.logger.warn(`Flash Call to user ${targetUserId} encountered an issue: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
