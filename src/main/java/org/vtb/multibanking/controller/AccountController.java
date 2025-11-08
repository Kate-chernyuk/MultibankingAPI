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

    /*
    Образец:
    curl.exe -X PUT http://localhost:8090/api/v1/accounts/team086-1/close -H "Content-Type: application/json" -H "Accept: application/json" -d '{\"bankType\": \"VBANK\", \"accountId\": \"4086ea9349c109a4b5\", \"action\": \"transfer\", \"destination_account_id\": \"42301cbfab662d0bb4f2\"}'
    Но есть проблема: 500 Internal Server Error - непонятно почему
    */
    @PutMapping("/{client_id}/close")
    public ResponseEntity<Map<String, Object>> closeAccount(
            @PathVariable String client_id,
            @RequestBody Map<String, Object> requestBody
    ) {
        try {
            BankType bankType = BankType.valueOf((String) requestBody.get("bankType"));
            String accountId = (String) requestBody.get("accountId");
            String action = (String) requestBody.get("action");
            String destinationAccountId = (String) requestBody.get("destination_account_id");

            BankClient bankClient = bankService.getBankClient(bankType);
            boolean closeResult = bankClient.closeAccount(accountId, action, destinationAccountId);

            if (closeResult) {
                Map<String, Object> response = Map.of(
                        "success", true,
                        "accountId", accountId,
                        "message", "Счёт успешно удалён"
                );
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> error = Map.of(
                        "success", false,
                        "message", "Не удалось удалить счёт: банк вернул ошибку"
                );
                return ResponseEntity.badRequest().body(error);
            }

        } catch (Exception e) {
            log.error("Ошибка закрытия счёта: {}", e.getMessage());
            Map<String, Object> error = Map.of(
                    "success", false,
                    "message", "Не удалось удалить счёт: " + e.getMessage()
            );
            return ResponseEntity.badRequest().body(error);
        }
    }
}