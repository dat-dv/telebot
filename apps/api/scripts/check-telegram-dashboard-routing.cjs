const assert = require('node:assert/strict');
require('reflect-metadata');

const { TelegramUpdate } = require('../dist/telegram/telegram.update');

async function run() {
  const replies = [];
  let geminiCalls = 0;
  const update = new TelegramUpdate(
    {
      chat: async () => {
        geminiCalls += 1;
        return { text: 'This must not be used.' };
      },
      queueToolConfirmation: () => {
        throw new Error('Not used in this check.');
      },
    },
    { isAdmin: () => false },
    { isAuthorized: () => true, generateAuthUrl: () => '' },
    {},
    {},
    {},
    {},
    {},
    {},
    {},
    { get: () => 'https://telebot.example.test' },
    { issueExchangeToken: async () => 'one-time-token' },
  );
  const context = {
    from: { id: 42, first_name: 'Dat' },
    message: { text: 'Cho anh xem dashboard' },
    reply: async (text, extra) => replies.push({ text, extra }),
  };

  await update.onTextMessage(context);

  assert.equal(geminiCalls, 0);
  assert.equal(replies.length, 1);
  assert.match(replies[0].text, /Dashboard/);
  assert.equal(
    replies[0].extra.reply_markup.inline_keyboard[0][0].url,
    'https://telebot.example.test/api/access?token=one-time-token',
  );
  console.log('Telegram dashboard routing check passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
