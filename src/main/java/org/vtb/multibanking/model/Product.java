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

    public String getFormattedInterestRate() {
        return interestRate != null ? interestRate + "%" : "—";
    }

    public String getFormattedAmountRange() {
        if (minAmount != null && maxAmount != null) {
            return minAmount + " - " + maxAmount + " ₽";
        } else if (minAmount != null) {
            return "от " + minAmount + " ₽";
        } else if (maxAmount != null) {
            return "до " + maxAmount + " ₽";
        }
        return "—";
    }

    public String getFormattedTerm() {
        return termMonth != null ? termMonth + " мес." : "—";
    }

    public String getProductTypeDisplay() {
        switch (productType) {
            case "deposit": return "Вклад";
            case "loan": return "Кредит";
            case "card": return "Карта";
            case "account": return "Счёт";
            default: return productType;
        }
    }
}
