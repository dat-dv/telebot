export interface AppConfig {
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

export default (): AppConfig => {
  const allowedUserIdsRaw = process.env.TELEGRAM_ALLOWED_USER_IDS || '';
  const allowedUserIds = allowedUserIdsRaw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map((id) => Number(id))
    .filter((id) => !isNaN(id));

  const adminId = process.env.TELEGRAM_ADMIN_ID
    ? Number(process.env.TELEGRAM_ADMIN_ID)
    : allowedUserIds[0] || undefined;

  if (adminId && !allowedUserIds.includes(adminId)) {
    allowedUserIds.push(adminId);
  }

  return {
    telegram: {
      token: process.env.TELEGRAM_BOT_TOKEN || '',
      allowedUserIds,
      adminId,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    },
    timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Ho_Chi_Minh',
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      credentialsPath: process.env.GOOGLE_OAUTH_CREDENTIALS || './gcp-oauth.keys.json',
    },
  };
};
