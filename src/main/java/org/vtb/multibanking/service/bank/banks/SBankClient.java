package org.vtb.multibanking.service.bank.banks;

import org.springframework.stereotype.Service;
import org.vtb.multibanking.config.BankConfig;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.service.integration.BankEventPublisher;
import org.vtb.multibanking.service.ConsentService;
import org.vtb.multibanking.service.bank.AbstractBankClient;

@Service
public class SBankClient extends AbstractBankClient {
    public SBankClient(BankConfig bankConfig, ConsentService consentService, BankEventPublisher bankEventPublisher) {
        super(
                bankConfig.getApis().get("sbank").getBaseUrl(),
                bankConfig.getApis().get("sbank").getClientId(),
                bankConfig.getApis().get("sbank").getClientSecret(),
                bankConfig.getApis().get("abank").getClientId() + "-1",
                consentService, bankEventPublisher
        );
    }

    @Override
    public BankType getBankType() {
        return BankType.SBANK;
    }

}
