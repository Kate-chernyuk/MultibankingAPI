package org.vtb.multibanking.service.bank.banks;

import org.springframework.stereotype.Service;
import org.vtb.multibanking.config.BankConfig;
import org.vtb.multibanking.model.Account;
import org.vtb.multibanking.model.Amount;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.model.Product;
import org.vtb.multibanking.service.ConsentService;
import org.vtb.multibanking.service.bank.AbstractBankClient;

import java.util.List;

@Service
public class ABankClient extends AbstractBankClient {
    public ABankClient(BankConfig bankConfig, ConsentService consentService) {
        super(
                bankConfig.getApis().get("abank").getBaseUrl(),
                bankConfig.getApis().get("abank").getClientId(),
                bankConfig.getApis().get("abank").getClientSecret(),
                bankConfig.getApis().get("abank").getClientId() + "-1",
                consentService
        );
    }

    @Override
    public BankType getBankType() {
        return BankType.ABANK;
    }

    @Override
    public List<Account> getAccounts(String clientId) throws Exception {
        return fetchAccounts();
    }

    @Override
    public String makePayment(String debtorAccount, String creditorAccount, Amount amount, BankType bankType) throws Exception {
        return createPayment(debtorAccount, creditorAccount, amount, bankType);
    }

    @Override
    public List<Product> listProductsCatalog() {
        return getProductsCatalog();
    }
}
