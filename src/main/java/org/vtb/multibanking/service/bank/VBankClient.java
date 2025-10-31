package org.vtb.multibanking.service.bank;

import org.springframework.stereotype.Service;
import org.vtb.multibanking.config.BankConfig;
import org.vtb.multibanking.model.Account;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.service.ConsentService;

import java.util.List;

@Service
public class VBankClient extends AbstractBankClient{
    public VBankClient(BankConfig bankConfig, ConsentService consentService) {
        super(
                bankConfig.getApis().get("vbank").getBaseUrl(),
                bankConfig.getApis().get("vbank").getClientId(),
                bankConfig.getApis().get("vbank").getClientSecret(),
                bankConfig.getApis().get("abank").getClientId() + "-1",
                consentService
        );
    }

    @Override
    public BankType getBankType() {
        return BankType.VBANK;
    }

    @Override
    public List<Account> getAccounts(String clientId) throws Exception {
        return fetchAccounts();
    }
}
