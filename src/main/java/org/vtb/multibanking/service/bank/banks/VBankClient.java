package org.vtb.multibanking.service.bank.banks;

import org.springframework.stereotype.Service;
import org.vtb.multibanking.config.BankConfig;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.service.integration.BankEventPublisher;
import org.vtb.multibanking.service.ConsentService;
import org.vtb.multibanking.service.bank.AbstractBankClient;

@Service
public class VBankClient extends AbstractBankClient {
    public VBankClient(BankConfig bankConfig, ConsentService consentService, BankEventPublisher bankEventPublisher) {
        super(
                bankConfig.getApis().get("vbank").getBaseUrl(),
                bankConfig.getApis().get("vbank").getClientId(),
                bankConfig.getApis().get("vbank").getClientSecret(),
                bankConfig.getApis().get("abank").getClientId() + "-1",
                consentService, bankEventPublisher
        );
    }

    @Override
    public BankType getBankType() {
        return BankType.VBANK;
    }

}
