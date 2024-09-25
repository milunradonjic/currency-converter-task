import { validateInput, executeTask } from '../src/index';
import { submitTask, waitForTaskCompletion, getTaskOutput } from '../src/api';

jest.mock('../src/api', () => ({
  submitTask: jest.fn(),
  waitForTaskCompletion: jest.fn(),
  getTaskOutput: jest.fn(),
}));

const mockedSubmitTask = submitTask as jest.Mock;
const mockedWaitForTaskCompletion = waitForTaskCompletion as jest.Mock;
const mockedGetTaskOutput = getTaskOutput as jest.Mock;

describe('Currency Converter Functions', () => {
  // Mock console.error to silence the expected error logs
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // Mock process.exit to avoid terminating the process during tests
  beforeAll(() => {
    jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit called with code ${code}`);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('validateInput', () => {
    it('should throw an error if source and target currencies are the same', () => {
      expect(() => validateInput('USD', 'USD', 1, 2, 100)).toThrow(
        'process.exit called with code 1'
      );
    });

    it('should throw an error if the minimum rate is greater than or equal to the maximum rate', () => {
      expect(() => validateInput('USD', 'EUR', 2, 1, 100)).toThrow(
        'process.exit called with code 1'
      );
    });

    it('should throw an error if the amount is less than or equal to zero', () => {
      expect(() => validateInput('USD', 'EUR', 1, 2, -100)).toThrow(
        'process.exit called with code 1'
      );
      expect(() => validateInput('USD', 'EUR', 1, 2, 0)).toThrow(
        'process.exit called with code 1'
      );
    });

    it('should throw an error if rates are less than or equal to zero', () => {
      expect(() => validateInput('USD', 'EUR', 0, 2, 100)).toThrow(
        'process.exit called with code 1'
      );
      expect(() => validateInput('USD', 'EUR', 1, -2, 100)).toThrow(
        'process.exit called with code 1'
      );
    });

    it('should not throw any errors for valid input', () => {
      expect(() => validateInput('USD', 'EUR', 1, 2, 100)).not.toThrow();
    });
  });

  describe('executeTask', () => {
    it('should submit a task and return the result', async () => {
      mockedSubmitTask.mockResolvedValue('mockTaskId');
      mockedWaitForTaskCompletion.mockResolvedValue(undefined);
      mockedGetTaskOutput.mockResolvedValue({
        convertedAmount: 85,
        rate: 1.17,
      });

      const applicationCode = 'mockApplicationCode';
      const args = '1 1.2 100';

      const output = await executeTask(applicationCode, args);

      expect(mockedSubmitTask).toHaveBeenCalledWith(applicationCode, args);
      expect(mockedWaitForTaskCompletion).toHaveBeenCalledWith('mockTaskId');
      expect(mockedGetTaskOutput).toHaveBeenCalledWith('mockTaskId');
      expect(output).toEqual({
        convertedAmount: 85,
        rate: 1.17,
      });
    });

    it('should handle errors thrown during task execution', async () => {
      mockedSubmitTask.mockRejectedValue(new Error('API Error'));

      const applicationCode = 'mockApplicationCode';
      const args = '1 1.2 100';

      await expect(executeTask(applicationCode, args)).rejects.toThrow(
        'API Error'
      );
    });
  });
});
