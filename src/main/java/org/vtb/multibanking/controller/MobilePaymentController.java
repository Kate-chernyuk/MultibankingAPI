package org.vtb.multibanking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.vtb.multibanking.model.mobile.MobileProduct;
import org.vtb.multibanking.model.mobile.PhoneNumberInfo;
import org.vtb.multibanking.service.GOSTBankClient;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/mobile")
public class MobilePaymentController {

    private final GOSTBankClient gostBankClient;

    public MobilePaymentController(GOSTBankClient gostBankClient) {
        this.gostBankClient = gostBankClient;
    }

    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> getClientProducts() {
        try {
            List<MobileProduct> products = gostBankClient.getMobileProducts();

            Map<String, Object> response = new HashMap<>();
            response.put("products", products);
            response.put("totalCount", products.size());
            response.put("timestamp", Instant.now());

            log.info("Успешно получено {} продуктов для мобильных платежей", products.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Ошибка получения продуктов для мобильных платежей: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Ошибка получения продуктов");
            errorResponse.put("timestamp", Instant.now());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/phone/{number}/info")
    public ResponseEntity<Map<String, Object>> getPhoneNumberInfo(@PathVariable String number) {
        try {
            PhoneNumberInfo phoneNumberInfo = gostBankClient.getInfoAboutPhoneNumber(number);

            Map<String, Object> response = new HashMap<>();
            response.put("phoneInfo", phoneNumberInfo);
            response.put("success", true);
            response.put("timestamp", Instant.now());

            log.info("Успешно получена информация о номере: {}", number);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Ошибка получения информации о номере: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Ошибка получения информации о номере");
            errorResponse.put("timestamp", Instant.now());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/payments")
    public ResponseEntity<Map<String, Object>> createMobilePayment(@RequestBody Map<String, Object> paymentRequest) {
        try {
            String serviceProviderId = (String) paymentRequest.get("serviceProviderId");
            String clientProductId = (String) paymentRequest.get("clientProductId");
            String clientProductType = (String) paymentRequest.get("clientProductType");
            String mobileNumber = (String) paymentRequest.get("mobileNumber");
            Map<String, Object> paySumData = (Map<String, Object>) paymentRequest.get("paySum");

            BigDecimal amount = new BigDecimal(paySumData.get("amount").toString());
            String currencyCode = (String) ((Map<String, Object>) paySumData.get("currency")).get("code");

            boolean providerReady = gostBankClient.startPayment(serviceProviderId);
            if (!providerReady) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Провайдер временно недоступен");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            String transactionId = gostBankClient.requestPayment(
                    serviceProviderId, clientProductId, clientProductType,
                    mobileNumber, amount, currencyCode
            );

            if (transactionId == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Не удалось создать платеж");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("transactionId", transactionId);
            response.put("message", "Платеж успешно создан");
            response.put("timestamp", Instant.now());

            log.info("Успешно создан платеж для номера {}: transactionId={}", mobileNumber, transactionId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Ошибка создания мобильного платежа: {}", e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Ошибка создания платежа");
            errorResponse.put("timestamp", Instant.now());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/payments/{paymentId}/confirm")
    public ResponseEntity<Map<String, Object>> confirmPayment(
            @PathVariable String paymentId,
            @RequestBody(required = false) Map<String, String> confirmRequest) {
        try {
            String purpose = confirmRequest.get("purpose");
            String code = confirmRequest.get("code");

            if (code == null || code.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Код подтверждения обязателен");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            gostBankClient.confirmPayment(paymentId, purpose, code);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("paymentId", paymentId);
            response.put("message", "Платеж успешно подтвержден");
            response.put("timestamp", Instant.now());

            log.info("Успешно подтвержден платеж: {}", paymentId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Ошибка подтверждения платежа {}: {}", paymentId, e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Ошибка подтверждения платежа");
            errorResponse.put("timestamp", Instant.now());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/payments/{paymentId}")
    public ResponseEntity<Map<String, Object>> getPaymentInfo(@PathVariable String paymentId) {
        try {
            Map<String, Object> paymentInfo = gostBankClient.getPayment(paymentId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("paymentId", paymentId);
            response.put("paymentInfo", paymentInfo);
            response.put("message", "Информация о платеже получена");
            response.put("timestamp", Instant.now());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Ошибка получения информации о платеже {}: {}", paymentId, e.getMessage());

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Ошибка получения информации о платеже");
            errorResponse.put("timestamp", Instant.now());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
