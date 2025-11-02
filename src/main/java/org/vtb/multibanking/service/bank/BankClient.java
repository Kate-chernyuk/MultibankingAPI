package org.vtb.multibanking.service.bank;

import org.vtb.multibanking.model.Account;
import org.vtb.multibanking.model.Amount;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.model.Product;

import java.util.List;

public interface BankClient {
    BankType getBankType();
    List<Account> getAccounts(String clientId) throws Exception;
    String makePayment(String debtorAccount, String creditorAccount, Amount amount, BankType bankType) throws Exception;
    List<Product> listProductsCatalog();
}
