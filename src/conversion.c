#include <stdio.h>
#include <stdlib.h>
#include <time.h>

double generateConversionRate(double rateMin, double rateMax) {
    double randomFactor = (double)rand() / RAND_MAX;
    return rateMin + randomFactor * (rateMax - rateMin);
}

int main(int argc, char *argv[]) {
    if (argc != 4) {
        printf("Usage: %s <rateMin> <rateMax> <amount>\n", argv[0]);
        return 1;
    }

    double rateMin = atof(argv[1]); 
    double rateMax = atof(argv[2]);
    double amount = atof(argv[3]);

    if (rateMax <= rateMin) {
        printf("Error: rateMax must be greater than rateMin.\n");
        return 1;  
    }

    if (amount <= 0) {
        printf("Error: amount must be positive and greater than zero.\n");
        return 1;  
    }

    // Seed the random number generator
    srand(time(NULL));

    double conversionRate = generateConversionRate(rateMin, rateMax);
    printf("Uncertain conversion rate: %f\n", conversionRate);

    double convertedAmount = amount * conversionRate;
    printf("Converted Amount: %lf\n", convertedAmount);

    return 0;
}
