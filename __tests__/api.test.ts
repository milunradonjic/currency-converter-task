import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  submitTask,
  fetchTaskStatus,
  waitForTaskCompletion,
  getTaskOutput,
} from '../src/api';

const mock = new MockAdapter(axios);

describe('API Tests', () => {
  const API_BASE_URL = 'https://api.signaloid.io';
  const taskId = '12345';
  const applicationCode = 'int main() { return 0; }';
  const args = '0.85 0.90 100';

  afterEach(() => {
    mock.reset();
  });

  it('should submit a task and return task ID', async () => {
    mock.onPost(`${API_BASE_URL}/tasks`).reply(200, { TaskID: taskId });

    const result = await submitTask(applicationCode, args);
    expect(result).toBe(taskId);
  });

  it('should fetch task status successfully', async () => {
    mock
      .onGet(`${API_BASE_URL}/tasks/${taskId}`)
      .reply(200, { Status: 'InProgress' });

    const status = await fetchTaskStatus(taskId);
    expect(status).toBe('InProgress');
  });

  it('should wait for task completion', async () => {
    // Simulate the status changing from 'InProgress' to 'Completed'
    mock
      .onGet(`${API_BASE_URL}/tasks/${taskId}`)
      .replyOnce(200, { Status: 'InProgress' })
      .onGet(`${API_BASE_URL}/tasks/${taskId}`)
      .replyOnce(200, { Status: 'Completed' });

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await waitForTaskCompletion(taskId);

    expect(spy).toHaveBeenCalledWith('Task status: InProgress');
    expect(spy).toHaveBeenCalledWith('Task status: Completed');
    spy.mockRestore();
  });

  it('should get task output and parse conversion rate and amount', async () => {
    const stdoutUrl = 'https://example.com/stdout';
    const stdoutData =
      'Uncertain conversion rate: 0.85\nConverted Amount: 85.00';

    // Mock the task outputs endpoint and the stdout stream
    mock
      .onGet(`${API_BASE_URL}/tasks/${taskId}/outputs`)
      .reply(200, { Stdout: stdoutUrl });
    mock.onGet(stdoutUrl).reply(200, stdoutData);

    const output = await getTaskOutput(taskId);
    expect(output).toEqual({
      rate: 0.85,
      convertedAmount: 85.0,
    });
  });

  it('should handle missing Stdout in getTaskOutput', async () => {
    const taskId = '12345';

    // Mock the response to not include Stdout
    mock.onGet(`${API_BASE_URL}/tasks/${taskId}/outputs`).reply(200, {});

    const spy = jest
      .spyOn(process, 'exit')
      .mockImplementation(
        (code?: string | number | null | undefined): never => {
          throw new Error(`process.exit called with ${code}`);
        }
      );

    await expect(getTaskOutput(taskId)).rejects.toThrow(
      'process.exit called with 1'
    );

    spy.mockRestore();
  });

  it('should handle error when fetching task status', async () => {
    const taskId = '12345';

    // Simulate an error
    mock.onGet(`${API_BASE_URL}/tasks/${taskId}`).reply(500);

    const spy = jest
      .spyOn(process, 'exit')
      .mockImplementation(
        (code?: string | number | null | undefined): never => {
          throw new Error(`process.exit called with ${code}`);
        }
      );

    await expect(fetchTaskStatus(taskId)).rejects.toThrow(
      'process.exit called with 1'
    );

    spy.mockRestore();
  });

  it('should handle empty output in getTaskOutput', async () => {
    const taskId = '12345';

    // Mock the output stream to be an empty string or invalid content
    const stdoutUrl = 'https://example.com/stdout';
    mock
      .onGet(`${API_BASE_URL}/tasks/${taskId}/outputs`)
      .reply(200, { Stdout: stdoutUrl });
    mock.onGet(stdoutUrl).reply(200, '');

    const spy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    await expect(getTaskOutput(taskId)).rejects.toThrow('process.exit called');

    spy.mockRestore();
  });

  it('should exit when API_KEY is not set', () => {
    const originalEnv = process.env;

    process.env = { ...originalEnv, SIGNALOID_API_KEY: undefined };

    const spy = jest
      .spyOn(process, 'exit')
      .mockImplementation(
        (code?: string | number | null | undefined): never => {
          throw new Error(`process.exit called with ${code}`);
        }
      );

    // Clear the cache to ensure the module is reloaded and API_KEY is checked
    jest.resetModules();

    expect(() => {
      require('../src/api');
    }).toThrow('process.exit called with 1');

    spy.mockRestore();
    process.env = originalEnv;
  });

  it('should handle error when submitting a task', async () => {
    mock.onPost(`${API_BASE_URL}/tasks`).reply(500);

    const spy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    await expect(submitTask(applicationCode, args)).rejects.toThrow(
      'process.exit'
    );

    spy.mockRestore();
  });
});
