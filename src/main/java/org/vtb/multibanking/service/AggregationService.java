package org.vtb.multibanking.service;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.vtb.multibanking.model.Account;
import org.vtb.multibanking.model.AggregationResult;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.service.bank.BankClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

@Service
@Slf4j
public class AggregationService {

    private final List<BankClient> bankClients;
    private final ExecutorService executorService;

    public AggregationService(List<BankClient> bankClients) {
        this.bankClients = bankClients;
        this.executorService = Executors.newFixedThreadPool(bankClients.size());
    }

    public AggregationResult aggregateAccounts(String clientId) {
        List<CompletableFuture<List<Account>>> futures = bankClients.stream()
                .map(client -> getAccountsAsync(client, clientId))
                .toList();

        List<Account> allAccounts = new ArrayList<>();
        Map<BankType, BigDecimal> balanceByBank = new HashMap<>();
        Map<String, BigDecimal> balanceByCurrency = new HashMap<>();

        for (int i = 0; i < futures.size(); i++) {
            BankClient bankClient = bankClients.get(i);
            CompletableFuture<List<Account>> future = futures.get(i);

            try {
                List<Account> bankAccounts = future.get(30, TimeUnit.SECONDS);
                allAccounts.addAll(bankAccounts);

                BigDecimal bankTotal = bankAccounts.stream()
                        .filter((Account::isActive))
                        .map(acc -> acc.getCurrentBalance() != null ? acc.getCurrentBalance() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                balanceByBank.put(bankClient.getBankType(), bankTotal);

                System.out.println("Число аккаутов в банке " + bankClient.getBankType() + ": " + bankAccounts.size() + "; общий баланс: " + bankTotal);
            } catch (TimeoutException te) {
                System.out.println("Превышено время извлечения данных из банка " + bankClient.getBankType());
                balanceByBank.put(bankClient.getBankType(), BigDecimal.ZERO);
            } catch (Exception e) {
                System.out.println("Ошибка при извлечении данных из банка " + bankClient.getBankType() + ":" + e.getMessage());
                balanceByBank.put(bankClient.getBankType(), BigDecimal.ZERO);
            }
        }

        BigDecimal totalBalance = BigDecimal.ZERO;
        BigDecimal totalAvailableBalance = BigDecimal.ZERO;
        long activeAccounts = 0;

        for (Account account: allAccounts) {
            if (account.isActive()) {
                activeAccounts++;

                BigDecimal balance = account.getCurrentBalance() != null ?
                        account.getCurrentBalance() : BigDecimal.ZERO;
                BigDecimal availableBalance = account.getAvailableBalance() != null ?
                        account.getAvailableBalance() : balance;

                totalBalance = totalBalance.add(balance);
                totalAvailableBalance = totalAvailableBalance.add(availableBalance);

                balanceByCurrency.merge(account.getCurrency(), balance, BigDecimal::add);
            }
        }

        return AggregationResult.builder()
                .success(true)
                .clientId(clientId)
                .totalBalance(totalBalance)
                .totalAvailableBalance(totalAvailableBalance)
                .totalAccounts(allAccounts.size())
                .activeAccounts(activeAccounts)
                .balanceByBank(balanceByBank)
                .balanceByCurrency(balanceByCurrency)
                .accounts(allAccounts)
                .timestamp(Instant.now())
                .build();
    }

    private CompletableFuture<List<Account>> getAccountsAsync(BankClient client, String clientId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return client.getAccounts(clientId);
            } catch (Exception e) {
                System.out.println("Ошибка получения информации об аккаунтах из банка " + client.getBankType() + ": " + e.getMessage());
                return List.of();
            }
        }, executorService);
    }

    @PreDestroy
    public void shutdown() {
        executorService.shutdown();
    }
}
