package org.vtb.multibanking.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Card {
    private String cardId;
    private String cardNumber;
    private String cardName;
    private String cardType;
    private String status;
    private String accountNumber;
    private BankType bankType;
    private Instant issueDate;
    private Instant expiryDate;
    private CardLimits limits;
    private BigDecimal balance;
}