#!/usr/bin/env node

import * as dotenv from 'dotenv';
dotenv.config();

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { submitTask, waitForTaskCompletion, getTaskOutput } from './api';

const program = new Command();

program
  .version('1.0.0')
  .requiredOption('-s, --source <currency>', 'Source currency code')
  .requiredOption('-t, --target <currency>', 'Target currency code')
  .requiredOption('-a, --amount <number>', 'Amount to convert', parseFloat)
  .requiredOption(
    '-min, --rate-min <number>',
    'Minimum conversion rate',
    parseFloat
  )
  .requiredOption(
    '-max, --rate-max <number>',
    'Maximum conversion rate',
    parseFloat
  );

/**
 * Validates the user-provided input for the currency conversion.
 *
 * @param sourceCurrency The source currency code.
 * @param targetCurrency The target currency code.
 * @param rateMin The minimum conversion rate.
 * @param rateMax The maximum conversion rate.
 * @param amount The amount to convert.
 *
 * @throws {Error} If the input is invalid.
 */
export function validateInput(
  sourceCurrency: string,
  targetCurrency: string,
  rateMin: number,
  rateMax: number,
  amount: number
) {
  if (sourceCurrency === targetCurrency) {
    console.error('Error: Source and target currencies cannot be the same.');
    process.exit(1);
  }

  if (rateMin >= rateMax) {
    console.error('Error: Minimum rate must be less than maximum rate.');
    process.exit(1);
  }

  if (amount <= 0) {
    console.error('Error: Amount must be a positive number.');
    process.exit(1);
  }

  if (rateMin <= 0 || rateMax <= 0) {
    console.error('Error: Rates must be positive numbers.');
    process.exit(1);
  }
}

/**
 * Submits a task to the Signaloid API and waits for it to complete before returning
 * the output of the task.
 *
 * @param applicationCode - The source code of the task to be executed.
 * @param args - The arguments to be passed to the task.
 *
 * @returns A Promise that resolves with the output of the task.
 */
export async function executeTask(applicationCode: string, args: string) {
  const taskId = await submitTask(applicationCode, args);
  await waitForTaskCompletion(taskId);
  return await getTaskOutput(taskId);
}

/**
 * The main entry point of the program. Parses the command line arguments and
 * executes a task on the Signaloid API to perform a currency conversion.
 *
 * @throws {Error} If the task fails or if the output cannot be parsed.
 */
async function main() {
  const options = program.opts();

  const sourceCurrency = options.source.toUpperCase();
  const targetCurrency = options.target.toUpperCase();
  const amount = options.amount;
  const rateMin = options.rateMin;
  const rateMax = options.rateMax;

  validateInput(sourceCurrency, targetCurrency, rateMin, rateMax, amount);

  const applicationCode = fs.readFileSync(
    path.join(__dirname, 'conversion.c'),
    'utf8'
  );
  const args = `${rateMin} ${rateMax} ${amount}`;

  try {
    const output = await executeTask(applicationCode, args);
    console.log(
      `Converted ${amount} ${sourceCurrency} to ${output.convertedAmount.toFixed(2)} ${targetCurrency}.`
    );
    console.log(`Conversion Rate: ${output.rate}`);
  } catch (error: any) {
    console.error('An error occurred:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  program.parse(process.argv);
  main();
}
