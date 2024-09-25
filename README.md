# Currency Converter Task

This is a command-line application that converts currencies while accounting for uncertainty in the conversion rate, leveraging the [Signaloid Cloud Engine API](https://docs.signaloid.io/docs/api/). The tool allows users to specify a conversion rate as a range and supports computations with uncertainty.

## Features

- Convert between specified currencies.
- Define conversion rates with uncertainty (e.g., 1 GBP = 1.15 - 1.20 EUR).
- Use Signaloid's API to compute the uncertainty distribution of the converted value.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/milunradonjic/currency-converter-task.git
   cd currency-converter-task
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables by copying the example:

   ```bash
   cp .env.example .env
   ```

4. Add your [Signaloid API Key](https://docs.signaloid.io/docs/api/#authentication) to the `.env` file.

## Usage

Run the command-line application:

```bash
npx ts-node src/index.ts -s <source_currency> -t <target_currency> -a <amount> -min <rate_min> -max <rate_max>
```

- `-s`: Source currency (e.g., GBP)
- `-t`: Target currency (e.g., EUR)
- `-a`: Amount to convert
- `-min`: Minimum conversion rate (e.g., 1.15)
- `-max`: Maximum conversion rate (e.g., 1.20)

### Example:

```bash
npx ts-node src/index.ts -s GBP -t EUR -a 100 -min 1.00 -max 1.20
```

## Running Tests

To run the tests, use:

```bash
npm run test
```

## License

This project is licensed under the MIT License.
