package org.vtb.multibanking.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Amount {
    private String amount;
    private String currency;

    public BigDecimal getAmountValue() {
        return new BigDecimal(amount);
    }
}