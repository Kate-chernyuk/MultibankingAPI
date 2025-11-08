package org.vtb.multibanking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.vtb.multibanking.model.Account;
import org.vtb.multibanking.service.bank.BankClient;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.service.bank.BankService;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

    private final BankService bankService;

    @PostMapping("/{clientId}/create")
    public ResponseEntity<Account> createAccount(
            @PathVariable String clientId,
            @RequestBody Map<String, Object> requestBody) {
        try {
            BankType bankType = BankType.valueOf((String) requestBody.get("bankType"));
            String accountType = (String) requestBody.get("accountType");
            BigDecimal initialBalance = BigDecimal.valueOf(Double.parseDouble((String) requestBody.get("initialBalance")));

            BankClient bankClient = bankService.getBankClient(bankType);
            Account newAccount = bankClient.createAccount(accountType, initialBalance);

            return ResponseEntity.ok(newAccount);

        } catch (Exception e) {
            log.error("Ошибка создания нового счёта: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}