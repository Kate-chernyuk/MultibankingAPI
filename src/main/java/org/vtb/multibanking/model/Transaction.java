package org.vtb.multibanking.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Transaction {
    private String transactionId;
    private String accountId;
    private Amount amount;
    private String creditDebitIndicator;
    private String status;
    private Instant bookingDateTime;
    private Instant valueDateTime;
    private String transactionInformation;
    private BankTransactionCode bankTransactionCode;
    private BankType bankType;
}