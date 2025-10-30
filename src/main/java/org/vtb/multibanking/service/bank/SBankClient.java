package org.vtb.multibanking.service.bank;

import org.springframework.stereotype.Service;
import org.vtb.multibanking.config.BankConfig;
import org.vtb.multibanking.model.Account;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.service.ConsentService;

import java.util.List;

@Service
public class SBankClient extends AbstractBankClient {
    public SBankClient(BankConfig bankConfig, ConsentService consentService) {
        super(
                bankConfig.getApis().get("sbank").getBaseUrl(),
                bankConfig.getApis().get("sbank").getClientId(),
                bankConfig.getApis().get("sbank").getClientSecret(),
                consentService
        );
    }

    @Override
    public BankType getBankType() {
        return BankType.SBANK;
    }

    @Override
    public List<Account> getAccounts(String clientId) throws Exception {
        return fetchAccounts();
    }
}
