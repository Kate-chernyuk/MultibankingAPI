package org.vtb.multibanking.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Account {
    private String accountId;
    private BankType bank;
    private String accountNumber;
    private String status;
    private String currency;
    private String accountType;
    private String accountSubType;
    private String nickname;
    private String openingDate;
    private List<AccountIdentification> accountIdentifications;
    private BigDecimal currentBalance;
    private BigDecimal availableBalance;
    private Instant lastUpdated;
    private List<Transaction> transactions = new ArrayList<>();

    public boolean isActive() {
        return "Enabled".equalsIgnoreCase(status);
    }

    public String getAccountNumber() {
        return accountIdentifications.stream()
                .filter(acc -> "RU.CBR.PAN".equals(acc.getSchemeName()))
                .map(AccountIdentification::getIdentification)
                .findFirst()
                .orElse(accountId);
    }
}
