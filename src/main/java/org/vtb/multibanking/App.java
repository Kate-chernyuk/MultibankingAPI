package org.vtb.multibanking;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.vtb.multibanking.model.AggregationResult;
import org.vtb.multibanking.service.AggregationService;

@Slf4j
@SpringBootApplication
public class App {
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }

    @Bean
    public CommandLineRunner testAggregation(AggregationService aggregationService) {
        return args -> {
            log.info("🚀 Bank Aggregator Application Started!");
            log.info("📊 Supported banks: VBank, ABank, SBank");
            log.info("📈 Aggregation endpoint: http://localhost:8090/api/v1/aggregate/{clientId}");

            if (args.length > 0 && "test".equals(args[0])) {
                runTest(aggregationService);
            }
        };
    }

    public void runTest(AggregationService aggregationService) {
        try {
            AggregationResult result = aggregationService.aggregateAccounts("team086");
            log.info("Test successful for client: team086");
            log.info("Accounts found: {}", result.getAccounts().size());
            log.info("Total balance: {}", result.getTotalBalance());
            log.info("Active accounts: {}", result.getActiveAccounts());

            result.getBalanceByBank().forEach((bank, balance) -> {
                log.info("   {}: {}", bank, balance);
            });
        } catch (Exception e) {
            log.warn("Test failed for client team086: {}", e.getMessage());
        }
    }
}