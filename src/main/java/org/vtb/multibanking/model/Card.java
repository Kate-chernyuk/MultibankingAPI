package org.vtb.multibanking.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    public String getFormattedCardNumber() {
        if (cardNumber != null && cardNumber.length() >= 16) {
            return "**** " + cardNumber.substring(cardNumber.length() - 4);
        }
        return cardNumber;
    }

    public String getCardTypeDisplay() {
        switch (cardType) {
            case "debit": return "Дебетовая";
            case "credit": return "Кредитная";
            default: return cardType;
        }
    }
}