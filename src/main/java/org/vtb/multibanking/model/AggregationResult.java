package org.vtb.multibanking.model;

import lombok.Data;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class AggregationResult {
    private boolean success;
    private String clientId;
    private BigDecimal totalBalance;
    private BigDecimal totalAvailableBalance;
    private long totalAccounts;
    private long activeAccounts;
    private Map<BankType, BigDecimal> balanceByBank;
    private Map<String, BigDecimal> balanceByCurrency;
    private List<Account> accounts;
    private Instant timestamp;
}
