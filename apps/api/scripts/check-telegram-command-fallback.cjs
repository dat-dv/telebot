const assert = require('node:assert/strict');
require('reflect-metadata');

const { TelegramUpdate } = require('../dist/telegram/telegram.update');
const { TelegramUiService } = require('../dist/telegram/services/telegram-ui.service');

function createHandler(appUrl = 'https://telebot.example.test', tokenIssueFails = true) {
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
      syncCommandMenu: async () => {},
      sendSafeReply: async (_ctx, text) => sentReplies.push(text),
    },
    {},
    {},
    {},
    {},
    { get: () => appUrl },
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
  // Case 1: Token creation fails -> must omit dashboard link
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
    assert.equal(menuArguments[0][3], '', `${command} must omit the dashboard link`);
  }

  // Case 2: appUrl is localhost -> must omit dashboard link to avoid Telegram BUTTON_URL_INVALID
  for (const [command, text] of [
    ['onStart', '/start'],
    ['onHelp', '/help'],
  ]) {
    const { handler, menuArguments, sentReplies } = createHandler('http://localhost:3000', false);
    await handler[command]({
      from: { id: 42, first_name: 'Dat' },
      message: { text },
    });
    assert.equal(sentReplies.length, 1, `${command} must still send a reply`);
    assert.equal(menuArguments[0][3], '', `${command} must omit localhost dashboard link`);
  }

  // Case 3: appUrl is valid HTTPS domain and token creation succeeds -> must include dashboard link
  for (const [command, text] of [
    ['onStart', '/start'],
    ['onHelp', '/help'],
  ]) {
    const { handler, menuArguments, sentReplies } = createHandler('https://telebot.example.test', false);
    await handler[command]({
      from: { id: 42, first_name: 'Dat' },
      message: { text },
    });
    assert.equal(sentReplies.length, 1, `${command} must send a reply`);
    assert.equal(
      menuArguments[0][3],
      'https://telebot.example.test/api/access?token=test-token-123',
      `${command} must include dashboard link when domain is valid`,
    );
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
