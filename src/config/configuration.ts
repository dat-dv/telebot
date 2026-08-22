export interface AppConfig {
  port: number;
  appUrl: string;
  telegram: {
    token: string;
    allowedUserIds: number[];
    adminId?: number;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
  timezone: string;
  google: {
    clientId: string;
    clientSecret: string;
    credentialsPath: string;
  };
}

function cleanEnv(val: string | undefined, defaultVal = ''): string {
  if (!val) return defaultVal;
  return val
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .trim();
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
    telegram: {
      token: cleanEnv(process.env.TELEGRAM_BOT_TOKEN),
      allowedUserIds,
      adminId,
    },
    gemini: {
      apiKey: cleanEnv(process.env.GEMINI_API_KEY),
      model: cleanEnv(process.env.GEMINI_MODEL, 'gemini-3.5-flash-lite'),
    },
    timezone: cleanEnv(process.env.DEFAULT_TIMEZONE, 'Asia/Ho_Chi_Minh'),
    google: {
      clientId: cleanEnv(process.env.GOOGLE_CLIENT_ID),
      clientSecret: cleanEnv(process.env.GOOGLE_CLIENT_SECRET),
      credentialsPath: cleanEnv(process.env.GOOGLE_OAUTH_CREDENTIALS, './gcp-oauth.keys.json'),
    },
  };
};
