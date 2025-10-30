package org.vtb.multibanking.service.bank;

import org.vtb.multibanking.model.Account;
import org.vtb.multibanking.model.BankType;

import java.util.List;

public interface BankClient {
    BankType getBankType();
    List<Account> getAccounts(String clientId) throws Exception;
}
