import assert from 'node:assert/strict';
import test from 'node:test';
import { AuthGuard } from './auth.guard';

void test('AuthGuard blocks an uninvited user callback before it reaches a Telegram action', async () => {
  const replies: string[] = [];
  const guard = new AuthGuard(
    {
      isAllowed: () => false,
      hasAdminConfigured: () => true,
    } as never,
    {} as never,
  );
  const ctx = {
    from: { id: 77, username: 'stranger' },
    callbackQuery: { data: 'confirm:action-1' },
    reply: (message: string) => Promise.resolve(replies.push(message)),
  };
  const executionContext = {
    getType: () => 'telegraf',
    getArgs: () => [ctx],
    getClass: () => AuthGuard,
    getHandler: () => undefined,
  };

  const allowed = await guard.canActivate(executionContext as never);

  assert.equal(allowed, false);
  assert.equal(replies.length, 1);
  assert.match(replies[0], /Truy cập bị từ chối/);
});
