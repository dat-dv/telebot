import { config as loadDotenv } from 'dotenv';
import { fromProjectRoot } from './project-root';

export interface EnvValidationResult {
  isValid: boolean;
  errors: Array<{ key: string; reason: string; guide: string }>;
}

function readEnv(key: string): string {
  return (
    process.env[key]
      ?.trim()
      .replace(/^['"]+|['"]+$/g, '')
      .trim() ?? ''
  );
}

function addError(
  errors: EnvValidationResult['errors'],
  key: string,
  reason: string,
  guide: string,
): void {
  errors.push({ key, reason, guide });
}

function isPositiveInteger(value: string): boolean {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function isBoolean(value: string): boolean {
  return ['true', 'false'].includes(value.toLowerCase());
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isPostgresUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'postgres:' || url.protocol === 'postgresql:';
  } catch {
    return false;
  }
}

export function loadEnvironment(): void {
  loadDotenv({ path: fromProjectRoot('.env.local'), override: false, quiet: true });
  loadDotenv({ path: fromProjectRoot('.env'), override: false, quiet: true });
}

export function validateEnvironment(): EnvValidationResult {
  const errors: Array<{ key: string; reason: string; guide: string }> = [];

  const requiredKeys = [
    'TELEGRAM_BOT_TOKEN',
    'GEMINI_API_KEY',
    'GEMINI_MODEL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DASHBOARD_ACCESS_TOKEN_SECRET',
    'DASHBOARD_REFRESH_TOKEN_SECRET',
    'TESSERACT_LANG_PATH',
  ];
  for (const key of requiredKeys) {
    if (!readEnv(key))
      addError(
        errors,
        key,
        'Biến môi trường bắt buộc đang trống.',
        'Khai báo giá trị trong file .env.local hoặc môi trường triển khai.',
      );
  }

  const adminId = readEnv('TELEGRAM_ADMIN_ID');
  if (!isPositiveInteger(adminId)) {
    addError(
      errors,
      'TELEGRAM_ADMIN_ID',
      'Phải là Telegram ID nguyên dương.',
      'Lấy ID từ @userinfobot và khai báo vào .env.local.',
    );
  }

  for (const key of [
    'PORT',
    'WHISPER_TIMEOUT_MS',
    'VOICE_MAX_DURATION_SECONDS',
    'VOICE_MAX_BYTES',
    'RECEIPT_IMAGE_TIMEOUT_MS',
    'RECEIPT_IMAGE_MAX_BYTES',
  ]) {
    if (!isPositiveInteger(readEnv(key)))
      addError(
        errors,
        key,
        'Phải là số nguyên dương.',
        'Khai báo một số nguyên dương trong .env.local.',
      );
  }

  for (const key of ['APP_URL', 'WEB_ORIGIN', 'WHISPER_URL']) {
    if (!isHttpUrl(readEnv(key)))
      addError(
        errors,
        key,
        'Phải là URL HTTP(S) hợp lệ.',
        'Khai báo URL đầy đủ, ví dụ https://example.com.',
      );
  }

  if (!isPostgresUrl(readEnv('DATABASE_URL'))) {
    addError(
      errors,
      'DATABASE_URL',
      'Phải là connection URL PostgreSQL hợp lệ.',
      'Khai báo theo dạng postgresql://user:password@host:5432/database.',
    );
  }

  if (!isBoolean(readEnv('CORS_ALLOW_ALL'))) {
    addError(
      errors,
      'CORS_ALLOW_ALL',
      'Chỉ nhận true hoặc false.',
      'Khai báo rõ true hoặc false trong .env.local.',
    );
  }
  if (!isBoolean(readEnv('TELEGRAM_LONG_POLLING_ENABLED'))) {
    addError(
      errors,
      'TELEGRAM_LONG_POLLING_ENABLED',
      'Chỉ nhận true hoặc false.',
      'Khai báo rõ true hoặc false trong .env.local.',
    );
  }

  if (!/^[0-9a-f]{64}$/i.test(readEnv('DATA_ENCRYPTION_KEY'))) {
    addError(
      errors,
      'DATA_ENCRYPTION_KEY',
      'Phải là khóa hexadecimal 64 ký tự.',
      'Tạo bằng openssl rand -hex 32 rồi lưu vào .env.local.',
    );
  }

  const allowedIds = readEnv('TELEGRAM_ALLOWED_USER_IDS');
  if (allowedIds && allowedIds.split(',').some((id) => !isPositiveInteger(id.trim()))) {
    addError(
      errors,
      'TELEGRAM_ALLOWED_USER_IDS',
      'Mỗi ID phải là số nguyên dương, ngăn cách bằng dấu phẩy.',
      'Xóa key này hoặc khai báo theo dạng 123,456.',
    );
  }

  const gramJsKeys = ['TELEGRAM_API_ID', 'TELEGRAM_API_HASH', 'TELEGRAM_SESSION'];
  const configuredGramJsKeys = gramJsKeys.filter((key) => Boolean(readEnv(key)));
  if (configuredGramJsKeys.length > 0 && configuredGramJsKeys.length !== gramJsKeys.length) {
    addError(
      errors,
      gramJsKeys.join(', '),
      'GramJS phải được cấu hình đủ cả ba biến hoặc tắt hoàn toàn.',
      'Khai báo đủ TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION; hoặc xóa cả ba để tắt flash-call.',
    );
  }
  if (
    configuredGramJsKeys.length === gramJsKeys.length &&
    !isPositiveInteger(readEnv('TELEGRAM_API_ID'))
  ) {
    addError(
      errors,
      'TELEGRAM_API_ID',
      'Phải là số nguyên dương.',
      'Dùng App API ID do my.telegram.org cấp.',
    );
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone: readEnv('DEFAULT_TIMEZONE') });
  } catch {
    addError(errors, 'DEFAULT_TIMEZONE', 'Timezone IANA không hợp lệ.', 'Ví dụ: Asia/Ho_Chi_Minh.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function printEnvValidationBanner(
  errors: Array<{ key: string; reason: string; guide: string }>,
): void {
  const line = '═'.repeat(76);
  const border = '─'.repeat(76);

  console.error('\n\x1b[41m\x1b[37m' + `╔${line}╗` + '\x1b[0m');
  console.error(
    '\x1b[41m\x1b[37m' +
      `║${' '.repeat(20)}❌ THIẾU CẤU HÌNH BIẾN MÔI TRƯỜNG (.ENV)${' '.repeat(20)}║` +
      '\x1b[0m',
  );
  console.error('\x1b[41m\x1b[37m' + `╚${line}╝` + '\x1b[0m\n');

  console.error(
    '\x1b[33m⚠️  Ứng dụng không thể khởi động vì thiếu các thông tin cấu hình bắt buộc sau:\x1b[0m\n',
  );

  errors.forEach((err, index) => {
    console.error(`\x1b[1m\x1b[31m${index + 1}. [BIẾN]: ${err.key}\x1b[0m`);
    console.error(`   ❌ \x1b[31mLý do:\x1b[0m ${err.reason}`);
    console.error(`   👉 \x1b[32mCách lấy:\x1b[0m ${err.guide}`);
    console.error(`   ${border}`);
  });

  console.error(
    '\n\x1b[36m📘 Hướng dẫn chi tiết từng bước xem tại file:\x1b[0m \x1b[1mdocs/quick-setup-runbook.md\x1b[0m\n',
  );
}
