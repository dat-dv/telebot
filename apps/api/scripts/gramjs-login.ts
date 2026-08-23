import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt: string): Promise<string> =>
  new Promise((resolve) => rl.question(prompt, resolve));

async function main() {
  console.log('\n======================================================');
  console.log('       📞 GRAMJS TELEGRAM SESSION GENERATOR          ');
  console.log('======================================================\n');
  console.log(
    '👉 Lấy API_ID và API_HASH tại: https://my.telegram.org (Mục API development tools)\n',
  );

  const rawApiId = await question('Nhập TELEGRAM_API_ID: ');
  const apiHash = await question('Nhập TELEGRAM_API_HASH: ');
  const phoneNumber = await question('Nhập Số điện thoại Telegram (VD: +84901234567): ');

  const apiId = Number(rawApiId.trim());
  if (isNaN(apiId) || !apiHash.trim()) {
    console.error('❌ API ID hoặc API Hash không hợp lệ.');
    rl.close();
    process.exit(1);
  }

  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash.trim(), {
    connectionRetries: 3,
  });

  await client.start({
    phoneNumber: async () => Promise.resolve(phoneNumber.trim()),
    password: async () => await question('Nhập Mật khẩu 2FA (nếu có): '),
    phoneCode: async () => await question('Nhập Mã OTP nhận được trong Telegram: '),
    onError: (err) => console.error('Lỗi xác thực:', err),
  });

  console.log('\n✅ ĐĂNG NHẬP THÀNH CÔNG!\n');
  const sessionToken = client.session.save() as unknown as string;

  console.log('================== DÁN VÀO .ENV ==================');
  console.log(`TELEGRAM_API_ID=${apiId}`);
  console.log(`TELEGRAM_API_HASH=${apiHash.trim()}`);
  console.log(`TELEGRAM_SESSION=${sessionToken}`);
  console.log('=================================================================\n');

  rl.close();
  await client.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  rl.close();
  process.exit(1);
});
