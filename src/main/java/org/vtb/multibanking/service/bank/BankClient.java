package org.vtb.multibanking.service.bank;

import org.vtb.multibanking.model.*;

import java.math.BigDecimal;
import java.util.List;

public interface BankClient {
    BankType getBankType();
    List<Account> fetchAccounts() throws Exception;
    Account createAccount(String accountType, BigDecimal initialBalance) throws Exception;
    String createPayment(String debtorAccount, String creditorAccount, Amount amount, BankType bankType) throws Exception;
    List<Product> getProductsCatalog();
    boolean getProduct(String productId, BigDecimal amount, String sourceAccountId) throws Exception;
    List<Product> getUserProductList() throws Exception;
    boolean deleteProduct(String agreementId, String repaymentAccountId, BigDecimal repaymentAmount) throws Exception;
    boolean closeAccount(String accountId, String action, String destinationAccountId) throws Exception;
    List<Card> getCards() throws Exception;
    Card createCard(String accountNumber, String cardType, String cardName) throws Exception;
    boolean deleteCard(String cardId) throws Exception;
}
