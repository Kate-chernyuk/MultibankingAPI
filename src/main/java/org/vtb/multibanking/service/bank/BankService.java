package org.vtb.multibanking.service.bank;

import org.springframework.beans.factory.annotation.Autowired;
import org.vtb.multibanking.model.BankType;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BankService {
    private final Map<BankType, BankClient> bankClients;

    @Autowired
    public BankService(List<BankClient> clients) {
        this.bankClients = clients.stream()
                .collect(Collectors.toMap(
                        BankClient::getBankType,
                        client -> client
                ));
    }

    public BankClient getBankClient(BankType bankType) {
        BankClient client = bankClients.get(bankType);
        if (client == null) {
            throw new IllegalArgumentException("Банк " + bankType + " не поддерживается");
        }
        return client;
    }
}