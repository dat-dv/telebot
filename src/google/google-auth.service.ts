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
  private oauth2Client: OAuth2Client | null = null;
  private readonly credentialsPath: string;
  private readonly tokenPath: string;

  constructor(private readonly configService: ConfigService) {
    this.credentialsPath = path.resolve(
      process.cwd(),
      this.configService.get<string>('google.credentialsPath', './gcp-oauth.keys.json'),
    );
    this.tokenPath = path.resolve(
      process.cwd(),
      this.configService.get<string>('google.tokenPath', './.gcp-saved-tokens.json'),
    );

    this.initializeClient();
  }

  public initializeClient(): boolean {
    try {
      if (!fs.existsSync(this.credentialsPath)) {
        this.logger.warn(
          `Google credentials file not found at: ${this.credentialsPath}. Please download your OAuth client keys and save them as gcp-oauth.keys.json.`,
        );
        return false;
      }

      const credentialsRaw = fs.readFileSync(this.credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsRaw) as CredentialsFile;
      const keys = credentials.installed || credentials.web || credentials;

      const clientId = keys.client_id;
      const clientSecret = keys.client_secret;
      const redirectUri = keys.redirect_uris?.[0] || 'http://localhost:3000/oauth2callback';

      if (!clientId || !clientSecret) {
        this.logger.warn(`Invalid Google credentials format in ${this.credentialsPath}.`);
        return false;
      }

      this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

      // Auto-save refreshed tokens
      this.oauth2Client.on('tokens', (tokens: Credentials) => {
        this.logger.log('Google OAuth tokens refreshed. Updating token file...');
        this.saveTokens(tokens);
      });

      if (!fs.existsSync(this.tokenPath)) {
        this.logger.warn(
          `Google tokens file not found at: ${this.tokenPath}. Run 'npm run auth' to authenticate your Google account.`,
        );
        return false;
      }

      const tokensRaw = fs.readFileSync(this.tokenPath, 'utf8').trim();
      if (!tokensRaw || tokensRaw.length === 0) {
        this.logger.warn(
          `Google tokens file is empty at: ${this.tokenPath}. Run 'npm run auth' to authenticate your Google account.`,
        );
        return false;
      }

      try {
        const tokens = JSON.parse(tokensRaw) as Credentials;
        this.oauth2Client.setCredentials(tokens);
        this.logger.log('Google OAuth2Client successfully authenticated.');
        return true;
      } catch {
        this.logger.warn(
          `Invalid JSON in tokens file at: ${this.tokenPath}. Run 'npm run auth' to re-authenticate.`,
        );
        return false;
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error initializing Google OAuth2 client: ${err.message}`, err.stack);
      return false;
    }
  }

  public getOAuth2Client(): OAuth2Client | null {
    if (!this.oauth2Client) {
      this.initializeClient();
    }
    return this.oauth2Client;
  }

  public isAuthorized(): boolean {
    const client = this.getOAuth2Client();
    if (!client) return false;
    const creds = client.credentials;
    return !!(creds && (creds.access_token || creds.refresh_token));
  }

  public saveTokens(tokens: Credentials): void {
    try {
      let existingTokens: Credentials = {};
      if (fs.existsSync(this.tokenPath)) {
        try {
          const raw = fs.readFileSync(this.tokenPath, 'utf8').trim();
          if (raw) {
            existingTokens = JSON.parse(raw) as Credentials;
          }
        } catch {
          // Ignore invalid JSON when reading existing tokens for update
        }
      }

      const updatedTokens: Credentials = {
        ...existingTokens,
        ...tokens,
      };

      fs.writeFileSync(this.tokenPath, JSON.stringify(updatedTokens, null, 2), 'utf8');
      if (this.oauth2Client) {
        this.oauth2Client.setCredentials(updatedTokens);
      }
      this.logger.log(`Tokens saved successfully to ${this.tokenPath}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to save tokens to ${this.tokenPath}: ${err.message}`);
    }
  }

  public getCredentialsPath(): string {
    return this.credentialsPath;
  }

  public getTokenPath(): string {
    return this.tokenPath;
  }
}
