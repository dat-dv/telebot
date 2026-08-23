export interface AppConfig {
  port: number;
  appUrl: string;
  webOrigin: string;
  telegram: {
    token: string;
    longPollingEnabled: boolean;
    allowedUserIds: number[];
    adminId?: number;
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
    credentialsPath: string;
  };
  reports: {
    dashboardAccessTokenSecret: string;
    dashboardRefreshTokenSecret: string;
  };
  security: { encryptionKey: string };
}

function cleanEnv(val: string | undefined, defaultVal = ''): string {
  if (!val) return defaultVal;
  return val
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .trim();
}

function parseBooleanEnv(val: string | undefined, defaultValue: boolean): boolean {
  const normalized = cleanEnv(val).toLowerCase();
  if (!normalized) return defaultValue;
  return !['false', '0', 'no', 'off'].includes(normalized);
}

export default (): AppConfig => {
  const allowedUserIdsRaw = cleanEnv(process.env.TELEGRAM_ALLOWED_USER_IDS);
  const allowedUserIds = allowedUserIdsRaw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map((id) => Number(id))
    .filter((id) => !isNaN(id));

  const rawAdminId = cleanEnv(process.env.TELEGRAM_ADMIN_ID);
  const adminId = rawAdminId ? Number(rawAdminId) : undefined;

  if (adminId && !allowedUserIds.includes(adminId)) {
    allowedUserIds.push(adminId);
  }

  const rawAppUrl = cleanEnv(process.env.APP_URL, 'http://localhost:3000');
  const appUrl = rawAppUrl.replace(/\/+$/, '');

  return {
    port: Number(cleanEnv(process.env.PORT, '3000')) || 3000,
    appUrl,
    webOrigin: cleanEnv(process.env.WEB_ORIGIN, appUrl),
    telegram: {
      token: cleanEnv(process.env.TELEGRAM_BOT_TOKEN),
      longPollingEnabled: parseBooleanEnv(process.env.TELEGRAM_LONG_POLLING_ENABLED, true),
      allowedUserIds,
      adminId,
      apiId: cleanEnv(process.env.TELEGRAM_API_ID),
      apiHash: cleanEnv(process.env.TELEGRAM_API_HASH),
      session: cleanEnv(process.env.TELEGRAM_SESSION),
    },
    gemini: {
      apiKey: cleanEnv(process.env.GEMINI_API_KEY),
      model: cleanEnv(process.env.GEMINI_MODEL, 'gemini-3.5-flash-lite'),
    },
    voice: {
      whisperUrl: cleanEnv(process.env.WHISPER_URL, 'http://127.0.0.1:8080'),
      timeoutMs: Number(cleanEnv(process.env.WHISPER_TIMEOUT_MS, '45000')) || 45_000,
      maxDurationSeconds: Number(cleanEnv(process.env.VOICE_MAX_DURATION_SECONDS, '90')) || 90,
      maxBytes: Number(cleanEnv(process.env.VOICE_MAX_BYTES, '8388608')) || 8 * 1024 * 1024,
    },
    receiptImage: {
      timeoutMs: Number(cleanEnv(process.env.RECEIPT_IMAGE_TIMEOUT_MS, '45000')) || 45_000,
      maxBytes:
        Number(cleanEnv(process.env.RECEIPT_IMAGE_MAX_BYTES, '10485760')) || 10 * 1024 * 1024,
      langPath: cleanEnv(process.env.TESSERACT_LANG_PATH, '/app/assets/tessdata'),
    },
    timezone: cleanEnv(process.env.DEFAULT_TIMEZONE, 'Asia/Ho_Chi_Minh'),
    google: {
      clientId: cleanEnv(process.env.GOOGLE_CLIENT_ID),
      clientSecret: cleanEnv(process.env.GOOGLE_CLIENT_SECRET),
      credentialsPath: cleanEnv(process.env.GOOGLE_OAUTH_CREDENTIALS, './gcp-oauth.keys.json'),
    },
    reports: {
      dashboardAccessTokenSecret: cleanEnv(process.env.DASHBOARD_ACCESS_TOKEN_SECRET),
      dashboardRefreshTokenSecret: cleanEnv(process.env.DASHBOARD_REFRESH_TOKEN_SECRET),
    },
    security: { encryptionKey: cleanEnv(process.env.DATA_ENCRYPTION_KEY) },
  };
};
