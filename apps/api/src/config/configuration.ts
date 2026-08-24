export interface AppConfig {
  port: number;
  appUrl: string;
  webOrigin: string;
  cors: { allowAll: boolean };
  database: {
    url?: string;
    ssl: boolean;
    synchronize: boolean;
  };
  redis: {
    url?: string;
  };
  telegram: {
    token: string;
    longPollingEnabled: boolean;
    allowedUserIds: number[];
    adminId: number;
    apiId?: string;
    apiHash?: string;
    session?: string;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  voice: {
    whisperUrl: string;
    timeoutMs: number;
    maxDurationSeconds: number;
    maxBytes: number;
  };
  receiptImage: {
    timeoutMs: number;
    maxBytes: number;
    langPath: string;
  };
  timezone: string;
  google: {
    clientId: string;
    clientSecret: string;
  };
  reports: {
    dashboardAccessTokenSecret: string;
    dashboardRefreshTokenSecret: string;
  };
  security: { encryptionKey: string };
}

function readEnv(name: string): string {
  const value = process.env[name]
    ?.trim()
    .replace(/^['"]+|['"]+$/g, '')
    .trim();
  if (!value) throw new Error(`${name} must be configured before the application starts.`);
  return value;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value
    ? value
        .trim()
        .replace(/^['"]+|['"]+$/g, '')
        .trim() || undefined
    : undefined;
}

function readBooleanEnv(name: string): boolean {
  return readEnv(name).toLowerCase() === 'true';
}

function readNumberEnv(name: string): number {
  return Number(readEnv(name));
}

export default (): AppConfig => {
  const allowedUserIds = (readOptionalEnv('TELEGRAM_ALLOWED_USER_IDS') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map((id) => Number(id))
    .filter((id) => !isNaN(id));

  const adminId = readNumberEnv('TELEGRAM_ADMIN_ID');

  if (adminId && !allowedUserIds.includes(adminId)) {
    allowedUserIds.push(adminId);
  }

  const appUrl = readEnv('APP_URL').replace(/\/+$/, '');

  return {
    port: readNumberEnv('PORT'),
    appUrl,
    webOrigin: readEnv('WEB_ORIGIN').replace(/\/+$/, ''),
    cors: { allowAll: readBooleanEnv('CORS_ALLOW_ALL') },
    database: {
      url: readOptionalEnv('DATABASE_URL'),
      ssl: readOptionalEnv('DATABASE_SSL') === 'true',
      synchronize: readOptionalEnv('TYPEORM_SYNCHRONIZE') === 'true',
    },
    redis: { url: readOptionalEnv('REDIS_URL') },
    telegram: {
      token: readEnv('TELEGRAM_BOT_TOKEN'),
      longPollingEnabled: readBooleanEnv('TELEGRAM_LONG_POLLING_ENABLED'),
      allowedUserIds,
      adminId,
      apiId: readOptionalEnv('TELEGRAM_API_ID'),
      apiHash: readOptionalEnv('TELEGRAM_API_HASH'),
      session: readOptionalEnv('TELEGRAM_SESSION'),
    },
    gemini: {
      apiKey: readEnv('GEMINI_API_KEY'),
      model: readEnv('GEMINI_MODEL'),
    },
    voice: {
      whisperUrl: readEnv('WHISPER_URL'),
      timeoutMs: readNumberEnv('WHISPER_TIMEOUT_MS'),
      maxDurationSeconds: readNumberEnv('VOICE_MAX_DURATION_SECONDS'),
      maxBytes: readNumberEnv('VOICE_MAX_BYTES'),
    },
    receiptImage: {
      timeoutMs: readNumberEnv('RECEIPT_IMAGE_TIMEOUT_MS'),
      maxBytes: readNumberEnv('RECEIPT_IMAGE_MAX_BYTES'),
      langPath: readEnv('TESSERACT_LANG_PATH'),
    },
    timezone: readEnv('DEFAULT_TIMEZONE'),
    google: {
      clientId: readEnv('GOOGLE_CLIENT_ID'),
      clientSecret: readEnv('GOOGLE_CLIENT_SECRET'),
    },
    reports: {
      dashboardAccessTokenSecret: readEnv('DASHBOARD_ACCESS_TOKEN_SECRET'),
      dashboardRefreshTokenSecret: readEnv('DASHBOARD_REFRESH_TOKEN_SECRET'),
    },
    security: { encryptionKey: readEnv('DATA_ENCRYPTION_KEY') },
  };
};
