package org.vtb.multibanking.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Product {
    private String productId;
    private String productType;
    private String productName;
    private String description;
    private String interestRate;
    private String minAmount;
    private String maxAmount;
    private Integer termMonth;
    private BankType bankType;
    private String agreementId;
    private String status;
}
