package org.vtb.multibanking.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Balance {
    private String accountId;
    private String type;
    private Instant dateTime;
    private Amount amount;
    private String creditDebitIndicator;

    public boolean isAvailableBalance() {
        return "InterimAvailable".equals(type);
    }

    public boolean isCurrentBalance() {
        return "InterimBooked".equals(type);
    }
}
