const assert = require('node:assert/strict');
require('reflect-metadata');

const { TelegramUpdate } = require('../dist/telegram/telegram.update');
const { TelegramUiService } = require('../dist/telegram/services/telegram-ui.service');

function createHandler(appUrl = 'https://telebot.example.test', tokenIssueFails = true) {
  const sentReplies = [];
  const menuArguments = [];
  const handler = new TelegramUpdate(
    {},
    { isAdmin: () => false, getPreferredLocale: async () => 'vi' },
    { generateAuthUrl: () => '', isAuthorized: () => true },
    {},
    {},
    {},
    {
      buildMainMenuInlineMarkup: (...args) => {
        menuArguments.push(args);
        return {};
      },
      syncCommandMenu: async () => {},
      sendSafeReply: async (_ctx, text) => sentReplies.push(text),
    },
    {},
    {},
    {},
    {},
    { get: () => appUrl, getOrThrow: () => appUrl },
    {
      issueExchangeToken: async () =>
        tokenIssueFails
          ? Promise.reject(new Error('database unavailable'))
          : Promise.resolve('test-token-123'),
    },
  );
  return { handler, menuArguments, sentReplies };
}

async function run() {
  // Case 1: onStart and onHelp send safe replies
  for (const [command, text] of [
    ['onStart', '/start'],
    ['onHelp', '/help'],
  ]) {
    const { handler, menuArguments, sentReplies } = createHandler('https://telebot.example.test', true);
    await handler[command]({
      from: { id: 42, first_name: 'Dat' },
      message: { text },
    });
    assert.equal(sentReplies.length, 1, `${command} must still send a reply`);
    assert.equal(menuArguments.length, 1, `${command} must invoke buildMainMenuInlineMarkup`);
  }

  // Case 2: onDashboard command when token issue succeeds
  {
    const { handler, sentReplies } = createHandler('https://telebot.example.test', false);
    await handler.onDashboard({
      from: { id: 42 },
      reply: async (text, options) => {
        sentReplies.push({ text, options });
      },
    });
    assert.equal(sentReplies.length, 1, 'onDashboard must send a reply');
  }

  // Case 4: Test TelegramUiService sendSafeReply fallback when reply with invalid markup throws
  const uiService = new TelegramUiService();
  let replyAttempts = 0;
  const mockCtx = {
    reply: async (_text, options) => {
      replyAttempts++;
      // Simulate first attempt (with Markdown & bad markup) failing
      if (replyAttempts === 1) {
        throw new Error('400: Bad Request: inline keyboard button URL is invalid');
      }
      // Simulate second attempt (plain text with bad markup) failing
      if (replyAttempts === 2) {
        throw new Error('400: Bad Request: inline keyboard button URL is invalid');
      }
      // Third attempt (plain text without markup) succeeds
      return { message_id: 123 };
    },
  };

  await uiService.sendSafeReply(mockCtx, 'Test message', { reply_markup: { inline_keyboard: [] } });
  assert.equal(replyAttempts, 3, 'sendSafeReply must fallback through 3 levels to deliver message');

  console.log('Telegram command fallback & URL resilience checks passed successfully.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
