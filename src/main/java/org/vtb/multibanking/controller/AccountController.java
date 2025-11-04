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

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

    private final BankService bankService;

    @PostMapping("/{bankType}/create")
    public ResponseEntity<Account> createAccount(
            @PathVariable BankType bankType,
            @RequestParam String accountType,
            @RequestParam(required = false, defaultValue = "0") BigDecimal initialBalance) {

        try {
            BankClient bankClient = bankService.getBankClient(bankType);
            Account newAccount = bankClient.createAccount(accountType, initialBalance);

            return ResponseEntity.ok(newAccount);

        } catch (Exception e) {
            log.error("Ошибка создания счета в банке {}: {}", bankType, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}