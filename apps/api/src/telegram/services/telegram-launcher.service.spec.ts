import assert from 'node:assert/strict';
import test from 'node:test';
import { TelegramLauncherService } from './telegram-launcher.service';

void test('TelegramLauncherService: does not start polling when longPollingEnabled is false', () => {
  let launchCalled = false;
  const mockBot = {
    launch: async () => {
      launchCalled = true;
      await Promise.resolve();
    },
    stop: () => {},
  };
  const mockConfig = {
    getOrThrow: (key: string) => {
      if (key === 'telegram.longPollingEnabled') return false;
      throw new Error(`Unexpected key: ${key}`);
    },
  };

  const service = new TelegramLauncherService(mockBot as never, mockConfig as never);
  service.onApplicationBootstrap();

  assert.equal(launchCalled, false);
});

void test('TelegramLauncherService: handles 409 Conflict gracefully without unhandled rejection', async () => {
  let launchCallCount = 0;
  const mockBot = {
    launch: async () => {
      launchCallCount++;
      const conflictError = new Error(
        '409: Conflict: terminated by other getUpdates request; make sure that only one bot instance is running',
      );
      return Promise.reject(conflictError);
    },
    stop: () => {},
  };
  const mockConfig = {
    getOrThrow: (key: string) => {
      if (key === 'telegram.longPollingEnabled') return true;
      throw new Error(`Unexpected key: ${key}`);
    },
  };

  const service = new TelegramLauncherService(mockBot as never, mockConfig as never);
  await service.startPollingWithResilience();

  assert.equal(launchCallCount, 1);

  // Cleanup on shutdown
  service.onApplicationShutdown();
});

void test('TelegramLauncherService: stops polling cleanly on application shutdown', () => {
  let stopSignal = '';
  const mockBot = {
    launch: async () => {
      await Promise.resolve();
    },
    stop: (signal?: string) => {
      stopSignal = signal ?? '';
    },
  };
  const mockConfig = {
    getOrThrow: (key: string) => {
      if (key === 'telegram.longPollingEnabled') return true;
      throw new Error(`Unexpected key: ${key}`);
    },
  };

  const service = new TelegramLauncherService(mockBot as never, mockConfig as never);
  service.onApplicationShutdown('SIGTERM');

  assert.equal(stopSignal, 'SIGTERM');
});
