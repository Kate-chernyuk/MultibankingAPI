package org.vtb.multibanking.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public
class CardLimits {
    private BigDecimal dailyLimit;
    private BigDecimal monthlyLimit;
    private BigDecimal singleTransactionLimit;
    private String currency;
}