package org.vtb.multibanking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.vtb.multibanking.model.AggregationResult;
import org.vtb.multibanking.service.AggregationService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class AggregationController {
    private final AggregationService aggregationService;

    @GetMapping("/aggregate/{clientId}")
    public ResponseEntity<AggregationResult> aggregateAccounts(@PathVariable String clientId) {
        try {
            AggregationResult aggregationResult = aggregationService.aggregateAccounts(clientId);
            return ResponseEntity.ok(aggregationResult);
        } catch (Exception e) {
            System.out.println("Ошибка аггрегации аккаунтов: " + e.getMessage());

            AggregationResult errorResult = AggregationResult.builder()
                    .success(false)
                    .clientId(clientId)
                    .totalBalance(BigDecimal.ZERO)
                    .totalAvailableBalance(BigDecimal.ZERO)
                    .totalAccounts(0)
                    .activeAccounts(0)
                    .balanceByBank(Map.of())
                    .balanceByCurrency(Map.of())
                    .accounts(List.of())
                    .timestamp(java.time.Instant.now())
                    .build();

            return ResponseEntity.status(500).body(errorResult);
        }
    }

    @GetMapping("/banks")
    public ResponseEntity<List<String>> getSupportedBanks() {
        List<String> banks = List.of("VBANK", "ABANK", "SBANK");
        return ResponseEntity.ok(banks);
    }
}
