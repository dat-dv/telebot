import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

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
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private userClients: Map<number, OAuth2Client> = new Map();
  private defaultClient: OAuth2Client | null = null;
  private readonly credentialsPath: string;
  private readonly defaultTokenPath: string;
  private readonly tokensDir: string;

  constructor(private readonly configService: ConfigService) {
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

    if (this.userClients.has(userId)) {
      return this.userClients.get(userId) || null;
    }

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
              this.saveTokensForUser(userId, refreshed);
            });
            this.userClients.set(userId, client);
            return client;
          }
        }
      } catch (err) {
        const error = err as Error;
        this.logger.error(`Error loading tokens for user ${userId}: ${error.message}`);
      }
    }

    // If user has no specific tokens, fallback to defaultClient for backward compatibility / Admin
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
      this.saveTokensForUser(userId, tokens);
      return true;
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to exchange code for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  public saveTokensForUser(userId: number, tokens: Credentials): void {
    const tokenPath = this.getUserTokenPath(userId);
    try {
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

      let client = this.userClients.get(userId);
      if (!client) {
        const newClient = this.createOAuth2Instance();
        if (newClient) {
          newClient.on('tokens', (refreshed) => this.saveTokensForUser(userId, refreshed));
          this.userClients.set(userId, newClient);
          client = newClient;
        }
      }
      if (client) {
        client.setCredentials(updated);
      }
      this.logger.log(`Saved OAuth tokens for user ${userId} to ${tokenPath}`);
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
