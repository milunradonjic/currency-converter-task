import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = 'https://api.signaloid.io';
const API_KEY = process.env.SIGNALOID_API_KEY;

if (!API_KEY) {
  console.error('Error: SIGNALOID_API_KEY environment variable not set.');
  process.exit(1);
}

/**
 * Handles an error that occurred during an API call.
 *
 * @param error - The error that occurred.
 * @param message - The message to print along with the error.
 * @returns This function never returns, and instead calls process.exit(1).
 */
function handleApiError(error: any, message: string): never {
  console.error(`${message}:`, error.response?.data ?? error.message);
  process.exit(1);
}

/**
 * Creates a set of headers to be used for API requests to Signaloid.
 * The headers include a Content-Type of application/json and an Authorization header
 * with the API key.
 *
 * @returns The headers to be used for the API request.
 */
function createHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: API_KEY,
  };
}

/**
 * Submits a task to the Signaloid API. The task runs the specified source code with the given arguments.
 *
 * @param applicationCode - The source code to be executed.
 * @param args - The arguments to be passed to the source code.
 * @returns The Task ID of the submitted task.
 */
async function postTask(
  applicationCode: string,
  args: string
): Promise<string> {
  const taskRequest = {
    Type: 'SourceCode',
    SourceCode: {
      Object: 'SourceCode',
      Code: applicationCode,
      Arguments: args,
      Language: 'C',
    },
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/tasks`, taskRequest, {
      headers: createHeaders(),
    });
    return response.data.TaskID;
  } catch (error: any) {
    handleApiError(error, 'Error submitting task');
  }
}

/**
 * Submits a task to the Signaloid API. The task runs the specified source code with the given arguments.
 * @param applicationCode The source code to be executed.
 * @param args The arguments to be passed to the source code.
 * @returns The Task ID of the submitted task.
 */
export async function submitTask(
  applicationCode: string,
  args: string
): Promise<string> {
  const taskId = await postTask(applicationCode, args);
  console.log(`Task submitted. Task ID: ${taskId}`);
  return taskId;
}

/**
 * Fetches the status of a task.
 *
 * @param taskId - The Task ID of the task to be queried.
 * @returns A Promise that resolves with the status of the task.
 */
export async function fetchTaskStatus(taskId: string): Promise<string> {
  try {
    const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}`, {
      headers: createHeaders(),
    });
    return response.data.Status;
  } catch (error: any) {
    handleApiError(error, 'Error checking task status');
  }
}

/**
 * Waits for a task to complete by polling the task status until it is Completed,
 * Cancelled, or Stopped.
 * @param taskId - The Task ID of the task to wait for.
 */
export async function waitForTaskCompletion(taskId: string) {
  while (true) {
    const status = await fetchTaskStatus(taskId);
    if (['Cancelled', 'Stopped'].includes(status)) {
      console.error(`Task is ${status}.`);
      process.exit(1);
    } else if (status === 'Completed') {
      console.log(`Task status: Completed`);
      return;
    }
    console.log(`Task status: ${status}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

/**
 * Fetches the output stream of a task.
 *
 * @param outputUrl - The URL of the output stream.
 * @returns A Promise that resolves with the output stream.
 */
async function fetchOutputStream(outputUrl: string) {
  try {
    const response = await axios.get(outputUrl);
    return response.data;
  } catch (error: any) {
    handleApiError(error, 'Error fetching output stream');
  }
}

/**
 * Extracts the conversion rate and converted amount from the output stream of a task.
 * @param stdout - The output stream of the task.
 * @returns An object containing the conversion rate, the full converted amount, and the rounded converted amount.
 */
function extractOutput(stdout: string) {
  const cleanOutput = stdout.replace(/Ux.*/, '');
  const conversionRateMatch = cleanOutput.match(
    /Uncertain conversion rate: (\d+\.\d+)/
  );
  const convertedAmountMatch = cleanOutput.match(
    /Converted Amount: (\d+\.\d+)/
  );

  if (!conversionRateMatch || !convertedAmountMatch) {
    console.error('Failed to extract conversion rate or converted amount');
    process.exit(1);
  }

  return {
    rate: parseFloat(conversionRateMatch[1]),
    convertedAmount: parseFloat(convertedAmountMatch[1]),
  };
}

/**
 * Fetches the output stream of a task and extracts the conversion rate and converted amount from it.
 * @param taskId - The Task ID of the task to get the output of.
 * @returns A Promise that resolves with an object containing the conversion rate, the full converted amount, and the rounded converted amount.
 */
export async function getTaskOutput(taskId: string) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/tasks/${taskId}/outputs`,
      {
        headers: createHeaders(),
      }
    );

    if (!response.data.Stdout) {
      console.error('No output found for the task.');
      process.exit(1);
    }

    const stdout = await fetchOutputStream(response.data.Stdout);
    return extractOutput(stdout);
  } catch (error: any) {
    handleApiError(error, 'Error getting task output');
  }
}
