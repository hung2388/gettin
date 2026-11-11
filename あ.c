
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main() {
    int a;
    scanf("%d", &a)
    for (int i = 2; i <= a; i++) {
        int is_prime = 1;
        for (int j = 2; j * j <= i; j++) {
            if (i % j == 0) {
                is_prime = 0;
                break;
            }
        }
        if (is_prime) {
            printf("%d ", i);
        }
    }
    printf("\n");
    return 0;
}