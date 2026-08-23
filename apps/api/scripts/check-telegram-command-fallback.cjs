const assert = require('node:assert/strict');
require('reflect-metadata');

const { TelegramUpdate } = require('../dist/telegram/telegram.update');

function createHandler() {
  const sentReplies = [];
  const menuArguments = [];
  const handler = new TelegramUpdate(
    {},
    { isAdmin: () => false },
    { generateAuthUrl: () => '', isAuthorized: () => true },
    {},
    {},
    {},
    {
      buildMainMenuInlineMarkup: (...args) => {
        menuArguments.push(args);
        return {};
      },
      sendSafeReply: async (_ctx, text) => sentReplies.push(text),
    },
    {},
    {},
    {},
    {},
    { get: () => 'https://telebot.example.test' },
    { issueExchangeToken: async () => Promise.reject(new Error('database unavailable')) },
  );
  return { handler, menuArguments, sentReplies };
}

async function run() {
  for (const [command, text] of [
    ['onStart', '/start'],
    ['onHelp', '/help'],
  ]) {
    const { handler, menuArguments, sentReplies } = createHandler();
    await handler[command]({
      from: { id: 42, first_name: 'Dat' },
      message: { text },
    });
    assert.equal(sentReplies.length, 1, `${command} must still send a reply`);
    assert.equal(menuArguments[0][3], '', `${command} must omit the dashboard link`);
  }

  console.log('Telegram command fallback check passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
