package org.vtb.multibanking.service.bank;

import org.vtb.multibanking.model.Account;
import org.vtb.multibanking.model.Amount;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.model.Product;

import java.math.BigDecimal;
import java.util.List;

public interface BankClient {
    BankType getBankType();
    List<Account> getAccounts(String clientId) throws Exception;
    Account createAccount(String accountType, BigDecimal initialBalance) throws Exception;
    String makePayment(String debtorAccount, String creditorAccount, Amount amount, BankType bankType) throws Exception;
    List<Product> listProductsCatalog();
    Boolean buyNewProduct(String productId, BigDecimal amount, String sourceAccountId) throws Exception;
    List<Product> listClientProducts() throws Exception;
    Boolean deleteSomeProduct(String agreementId, String repaymentAccountId, BigDecimal repaymentAmount) throws Exception;
}
