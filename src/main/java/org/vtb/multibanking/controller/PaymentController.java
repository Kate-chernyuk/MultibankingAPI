package org.vtb.multibanking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.vtb.multibanking.model.Amount;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.service.bank.BankClient;
import org.vtb.multibanking.service.bank.BankService;
import java.util.Map;

@Slf4j
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Controller
public class PaymentController {

    private final BankService bankService;

    /*
    Образец запроса:
    curl.exe -X POST http://localhost:8090/api/v1/payments/team086-2 -H "Content-Type: application/json" -H "Accept: application/json" -d '{\"fromAccount\": \"4081781008602032653\", \"toAccount\": \"408aea555af8ad04c0\", \"bankTypeTo\": \"VBANK\", \"bankTypeFrom\": \"VBANK\", \"amount\": {\"amount\": \"12000\", \"currency\": \"RUB\"}}'
    {"toBank":"VBANK","message":"Платёж успешно создан","paymentId":"pay-8788ff7e58b2","success":true,"fromBank":"VBANK"}
    */
    @PostMapping("/{client_id}")
    public ResponseEntity<Map<String, Object>> createNewPayment(
            @PathVariable String client_id,
            @RequestBody Map<String, Object> paymentRequest) {
        try {
            String fromAccount = (String) paymentRequest.get("fromAccount");
            String toAccount = (String) paymentRequest.get("toAccount");

            String bankTypeToStr = (String) paymentRequest.get("bankTypeTo");
            String bankTypeFromStr = (String) paymentRequest.get("bankTypeFrom");
            BankType bankTypeTo = BankType.valueOf(bankTypeToStr);
            BankType bankTypeFrom = BankType.valueOf(bankTypeFromStr);

            Map<String, String> amountMap = (Map<String, String>) paymentRequest.get("amount");
            Amount amount = new Amount(
                    amountMap.get("amount"),
                    amountMap.get("currency")
            );

            BankClient bankClient = bankService.getBankClient(bankTypeFrom);

            String paymentId = bankClient.createPayment(fromAccount, toAccount, amount, bankTypeTo);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "client", client_id,
                    "paymentId", paymentId,
                    "message", "Платёж успешно создан",
                    "fromBank", bankTypeFrom,
                    "toBank", bankTypeTo
            ));
        } catch (Exception e) {
            log.error("Ошибка платежа: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}
