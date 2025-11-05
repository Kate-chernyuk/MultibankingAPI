package org.vtb.multibanking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;
import org.vtb.multibanking.model.AggregationResult;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.model.Transaction;
import org.vtb.multibanking.service.AggregationService;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class AggregationController {
    private final AggregationService aggregationService;
    private String lastClientId;
    private List<BankType> lastBankTypes;
    //TODO отделить транзакции на фронте: сейчас общим фронтом

    @GetMapping("/aggregate/{clientId}")
    public ResponseEntity<AggregationResult> aggregateAccounts(
            @PathVariable String clientId,
            @RequestParam(required = false) List<BankType> bankTypes) {
        try {
            AggregationResult aggregationResult;
            if (bankTypes != null && !bankTypes.isEmpty()) {
                aggregationResult = aggregationService.aggregateAccounts(clientId, bankTypes);
            } else {
                aggregationResult = aggregationService.aggregateAccounts(clientId, List.of());
            }

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

    @GetMapping("/transactions/{clientId}")
    public ResponseEntity<Map<String, Object>> getAllUserTransactions(
            @PathVariable String clientId,
            @RequestParam(required = false) List<BankType> bankTypes
            ) {
        try {
            AggregationResult aggregationResult;
            if (bankTypes != null && !bankTypes.isEmpty()) {
                aggregationResult = aggregationService.aggregateAccounts(clientId, bankTypes);
            } else {
                aggregationResult = aggregationService.aggregateAccounts(clientId, List.of());
            }

            List<Transaction> allTransactions = aggregationResult.getAccounts().stream()
                    .flatMap(acc -> acc.getTransactions().stream())
                    .sorted((t1, t2) -> t2.getBookingDateTime().compareTo(t1.getBookingDateTime()))
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("transactions", allTransactions);
            response.put("totalCount", allTransactions.size());
            response.put("timestamp", Instant.now());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Ошибка получения всех транзакций: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @Scheduled(cron = "${app.update.cron:0 */5 * * * *}")
    public void autoUpdate() {
        log.info("Автообновление данных...");
        aggregateAccounts(lastClientId, lastBankTypes);
        //TODO не забыть добавить автообновление на фронте - бек работает (см. консоль)
    }
}
