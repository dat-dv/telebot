import assert from 'node:assert/strict';
import test from 'node:test';
import { GoogleTasksService } from '../../google/google-tasks.service';
import { CreateTasksTool } from './create-tasks.tool';

void test('CreateTasksTool creates every valid task and reports a partial failure', async () => {
  const createdTitles: string[] = [];
  const tasksService = {
    createTask: ({ title }: { title: string }) => {
      if (title === 'Cam') throw new Error('Google Tasks unavailable');
      createdTitles.push(title);
      return Promise.resolve({ id: `id-${title}` });
    },
  } as unknown as GoogleTasksService;
  const tool = new CreateTasksTool(tasksService);

  const result = await tool.execute(
    { tasks: [{ title: 'Cà phê' }, { title: 'Cam' }, { title: 'Sữa' }] },
    { userId: 42 },
  );

  assert.deepEqual(createdTitles, ['Cà phê', 'Sữa']);
  assert.equal(result.success, false);
  assert.deepEqual(
    result.created.map((task) => task.title),
    ['Cà phê', 'Sữa'],
  );
  assert.deepEqual(result.failed, [{ title: 'Cam', error: 'Google Tasks unavailable' }]);
});

void test('CreateTasksTool rejects an empty task list', async () => {
  const tool = new CreateTasksTool({} as GoogleTasksService);
  const result = await tool.execute({ tasks: [] });

  assert.equal(result.success, false);
  assert.equal(result.message, 'Danh sách công việc phải có từ 1 đến 20 mục.');
});
