import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';
import { UserTokenEntity } from '../database/entities/user-token.entity';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
];

interface InstalledCredentials {
  client_id: string;
  client_secret: string;
  redirect_uris?: string[];
  [key: string]: unknown;
}

interface CredentialsFile {
  installed?: InstalledCredentials;
  web?: InstalledCredentials;
  client_id?: string;
  client_secret?: string;
  redirect_uris?: string[];
}

@Injectable()
export class GoogleAuthService implements OnModuleInit {
  private readonly logger = new Logger(GoogleAuthService.name);
  private userClients: Map<string, OAuth2Client> = new Map();
  private defaultClient: OAuth2Client | null = null;
  private readonly credentialsPath: string;
  private readonly defaultTokenPath: string;
  private readonly tokensDir: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserTokenEntity)
    private readonly tokenRepo: Repository<UserTokenEntity>,
  ) {
    this.credentialsPath = path.resolve(
      process.cwd(),
      this.configService.get<string>('google.credentialsPath', './gcp-oauth.keys.json'),
    );
    this.defaultTokenPath = path.resolve(
      process.cwd(),
      this.configService.get<string>('google.tokenPath', './.gcp-saved-tokens.json'),
    );

    this.tokensDir = path.resolve(process.cwd(), 'data', 'tokens');
    if (!fs.existsSync(this.tokensDir)) {
      fs.mkdirSync(this.tokensDir, { recursive: true });
    }

    this.initializeDefaultClient();
  }

  public async onModuleInit(): Promise<void> {
    await this.preloadTokensFromDatabase();
  }

  private async preloadTokensFromDatabase(): Promise<void> {
    try {
      const allTokens = await this.tokenRepo.find();
      for (const t of allTokens) {
        if (t.accessToken || t.refreshToken) {
          const client = this.createOAuth2Instance();
          if (client) {
            client.setCredentials({
              access_token: t.accessToken,
              refresh_token: t.refreshToken,
              scope: t.scope,
              token_type: t.tokenType,
              expiry_date: t.expiryDate ? Number(t.expiryDate) : undefined,
            });
            const numUserId = Number(t.userId);
            client.on('tokens', (refreshed: Credentials) => {
              void this.saveTokensForUser(numUserId, refreshed);
            });
            this.userClients.set(t.userId, client);
          }
        }
      }
      this.logger.log(`Preloaded ${allTokens.length} user Google OAuth token(s) from SQLite.`);
    } catch (err) {
      const error = err as Error;
      this.logger.warn(`Could not preload tokens from database: ${error.message}`);
    }
  }

  private getClientKeys(): { clientId: string; clientSecret: string; redirectUri: string } | null {
    try {
      if (!fs.existsSync(this.credentialsPath)) {
        this.logger.warn(`Google credentials file not found at: ${this.credentialsPath}`);
        return null;
      }

      const raw = fs.readFileSync(this.credentialsPath, 'utf8');
      const credentials = JSON.parse(raw) as CredentialsFile;
      const keys = credentials.installed || credentials.web || credentials;

      const clientId = keys.client_id;
      const clientSecret = keys.client_secret;
      const redirectUri = keys.redirect_uris?.[0] || 'http://localhost:3000/oauth2callback';

      if (!clientId || !clientSecret) {
        this.logger.warn(`Invalid Google credentials format in ${this.credentialsPath}`);
        return null;
      }

      return { clientId, clientSecret, redirectUri };
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error reading client keys: ${error.message}`);
      return null;
    }
  }

  private createOAuth2Instance(): OAuth2Client | null {
    const keys = this.getClientKeys();
    if (!keys) return null;
    return new google.auth.OAuth2(keys.clientId, keys.clientSecret, keys.redirectUri);
  }

  public initializeDefaultClient(): boolean {
    try {
      const client = this.createOAuth2Instance();
      if (!client) return false;

      this.defaultClient = client;

      this.defaultClient.on('tokens', (tokens: Credentials) => {
        this.logger.log('Default Google OAuth tokens refreshed. Updating default token file...');
        this.saveDefaultTokens(tokens);
      });

      if (fs.existsSync(this.defaultTokenPath)) {
        const raw = fs.readFileSync(this.defaultTokenPath, 'utf8').trim();
        if (raw) {
          const tokens = JSON.parse(raw) as Credentials;
          this.defaultClient.setCredentials(tokens);
          this.logger.log('Default Google OAuth2Client successfully authenticated.');
          return true;
        }
      }
      return false;
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error initializing default Google OAuth2 client: ${error.message}`);
      return false;
    }
  }

  public getUserTokenPath(userId: number): string {
    return path.join(this.tokensDir, `${userId}.json`);
  }

  public getOAuth2Client(userId?: number): OAuth2Client | null {
    if (!userId) {
      if (!this.defaultClient) this.initializeDefaultClient();
      return this.defaultClient;
    }

    const strId = userId.toString();
    if (this.userClients.has(strId)) {
      return this.userClients.get(strId) || null;
    }

    // Check file fallback
    const tokenPath = this.getUserTokenPath(userId);
    if (fs.existsSync(tokenPath)) {
      try {
        const raw = fs.readFileSync(tokenPath, 'utf8').trim();
        if (raw) {
          const tokens = JSON.parse(raw) as Credentials;
          const client = this.createOAuth2Instance();
          if (client) {
            client.setCredentials(tokens);
            client.on('tokens', (refreshed: Credentials) => {
              this.logger.log(`Tokens refreshed for user ${userId}. Saving to user storage...`);
              void this.saveTokensForUser(userId, refreshed);
            });
            this.userClients.set(strId, client);
            return client;
          }
        }
      } catch (err) {
        const error = err as Error;
        this.logger.error(`Error loading tokens for user ${userId}: ${error.message}`);
      }
    }

    // Fallback to defaultClient if admin/single-user
    if (!this.defaultClient) this.initializeDefaultClient();
    return this.defaultClient;
  }

  public isAuthorized(userId?: number): boolean {
    const client = this.getOAuth2Client(userId);
    if (!client) return false;
    const creds = client.credentials;
    return !!(creds && (creds.access_token || creds.refresh_token));
  }

  public hasUserSpecificAuth(userId: number): boolean {
    const strId = userId.toString();
    if (this.userClients.has(strId)) return true;
    const tokenPath = this.getUserTokenPath(userId);
    return fs.existsSync(tokenPath);
  }

  public generateAuthUrl(userId: number): string {
    const client = this.createOAuth2Instance();
    if (!client) {
      throw new Error('Google OAuth credentials chưa được cấu hình.');
    }

    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GOOGLE_SCOPES,
      state: userId.toString(),
    });
  }

  public async exchangeCodeForTokens(userId: number, code: string): Promise<boolean> {
    const client = this.createOAuth2Instance();
    if (!client) {
      throw new Error('Google OAuth credentials chưa được cấu hình.');
    }

    try {
      const { tokens } = await client.getToken(code.trim());
      await this.saveTokensForUser(userId, tokens);
      return true;
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to exchange code for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  public async saveTokensForUser(userId: number, tokens: Credentials): Promise<void> {
    const strId = userId.toString();
    const tokenPath = this.getUserTokenPath(userId);

    try {
      // 1. Save to SQLite database
      let dbToken = await this.tokenRepo.findOne({ where: { userId: strId } });
      if (!dbToken) {
        dbToken = this.tokenRepo.create({
          userId: strId,
          accessToken: tokens.access_token || undefined,
          refreshToken: tokens.refresh_token || undefined,
          scope: tokens.scope || undefined,
          tokenType: tokens.token_type || undefined,
          expiryDate: tokens.expiry_date || undefined,
        });
      } else {
        if (tokens.access_token) dbToken.accessToken = tokens.access_token;
        if (tokens.refresh_token) dbToken.refreshToken = tokens.refresh_token;
        if (tokens.scope) dbToken.scope = tokens.scope;
        if (tokens.token_type) dbToken.tokenType = tokens.token_type;
        if (tokens.expiry_date) dbToken.expiryDate = tokens.expiry_date;
      }
      await this.tokenRepo.save(dbToken);

      // 2. Also save to disk JSON for double-persistence
      let existingTokens: Credentials = {};
      if (fs.existsSync(tokenPath)) {
        try {
          const raw = fs.readFileSync(tokenPath, 'utf8').trim();
          if (raw) existingTokens = JSON.parse(raw) as Credentials;
        } catch {
          // ignore
        }
      }

      const updated = { ...existingTokens, ...tokens };
      fs.writeFileSync(tokenPath, JSON.stringify(updated, null, 2), 'utf8');

      // 3. Update client in memory
      let client = this.userClients.get(strId);
      if (!client) {
        const newClient = this.createOAuth2Instance();
        if (newClient) {
          newClient.on('tokens', (refreshed: Credentials) => {
            void this.saveTokensForUser(userId, refreshed);
          });
          this.userClients.set(strId, newClient);
          client = newClient;
        }
      }
      if (client) {
        client.setCredentials(updated);
      }
      this.logger.log(`Saved OAuth tokens for user ${userId} to SQLite & disk.`);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to save tokens for user ${userId}: ${error.message}`);
    }
  }

  public saveDefaultTokens(tokens: Credentials): void {
    try {
      let existingTokens: Credentials = {};
      if (fs.existsSync(this.defaultTokenPath)) {
        try {
          const raw = fs.readFileSync(this.defaultTokenPath, 'utf8').trim();
          if (raw) existingTokens = JSON.parse(raw) as Credentials;
        } catch {
          // ignore
        }
      }

      const updated = { ...existingTokens, ...tokens };
      fs.writeFileSync(this.defaultTokenPath, JSON.stringify(updated, null, 2), 'utf8');
      if (this.defaultClient) {
        this.defaultClient.setCredentials(updated);
      }
      this.logger.log(`Saved default tokens to ${this.defaultTokenPath}`);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to save default tokens: ${error.message}`);
    }
  }
}
