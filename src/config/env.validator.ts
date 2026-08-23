import * as fs from 'fs';
import * as path from 'path';

export interface EnvValidationResult {
  isValid: boolean;
  errors: Array<{ key: string; reason: string; guide: string }>;
}

export function validateEnvironment(): EnvValidationResult {
  const errors: Array<{ key: string; reason: string; guide: string }> = [];

  // 1. TELEGRAM_BOT_TOKEN
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    errors.push({
      key: 'TELEGRAM_BOT_TOKEN',
      reason: 'Thiếu Token của Telegram Bot.',
      guide: 'Mở Telegram, tìm bot @BotFather (gõ /newbot) để tạo bot và lấy HTTP API Token.',
    });
  }

  // 2. TELEGRAM_ADMIN_ID
  const adminId = process.env.TELEGRAM_ADMIN_ID?.trim();
  if (!adminId || isNaN(Number(adminId))) {
    errors.push({
      key: 'TELEGRAM_ADMIN_ID',
      reason: 'Thiếu hoặc sai định dạng Telegram ID của Quản trị viên (Admin).',
      guide: 'Mở Telegram, nhắn bất kỳ tin nhắn nào cho bot @userinfobot để lấy dãy số Id của bạn.',
    });
  }

  // 3. GEMINI_API_KEY
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  if (!geminiApiKey) {
    errors.push({
      key: 'GEMINI_API_KEY',
      reason: 'Thiếu API Key của Google Gemini AI.',
      guide: 'Truy cập https://aistudio.google.com/apikey để tạo API Key miễn phí (500 lượt/ngày).',
    });
  }

  if (!/^[0-9a-f]{64}$/i.test(process.env.DATA_ENCRYPTION_KEY?.trim() || '')) {
    errors.push({
      key: 'DATA_ENCRYPTION_KEY',
      reason: 'Thiếu khóa mã hóa 32-byte cho token người dùng.',
      guide: 'Tạo bằng lệnh: openssl rand -hex 32, rồi lưu vào .env.',
    });
  }

  // 4. GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET (or gcp-oauth.keys.json)
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const credentialsPath = path.resolve(
    process.cwd(),
    process.env.GOOGLE_OAUTH_CREDENTIALS || './gcp-oauth.keys.json',
  );
  const hasFileCredentials = fs.existsSync(credentialsPath);

  if ((!googleClientId || !googleClientSecret) && !hasFileCredentials) {
    errors.push({
      key: 'GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET',
      reason: 'Chưa cấu hình thông tin định danh Google OAuth 2.0 (Client ID & Client Secret).',
      guide:
        'Truy cập https://console.cloud.google.com/apis/credentials ➔ Tạo OAuth Client ID (Web/Desktop) và điền GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET vào .env.',
    });
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
