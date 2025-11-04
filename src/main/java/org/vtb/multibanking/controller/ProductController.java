package org.vtb.multibanking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.model.Product;
import org.vtb.multibanking.service.bank.BankService;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Controller
public class ProductController {

    private final BankService bankService;

    @GetMapping("/catalog")
    public ResponseEntity<Map<String, Object>> getProductsCatalog(
            @RequestParam(required = false) String bankType,
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String sortBy
    ) {
       try {
           List<Product> allProducts = new ArrayList<>();

           for (BankType type: BankType.values()) {
               try {
                   var bankClient = bankService.getBankClient(type);
                   List<Product> bankProducts = bankClient.listProductsCatalog();
                   allProducts.addAll(bankProducts);
               } catch (Exception e) {
                   log.warn("Не удалось получить продукты банка {}: {}", type, e.getMessage());
               }
           }

           if (bankType != null && !bankType.isEmpty()) {
               allProducts = allProducts.stream()
                       .filter(product -> product.getBankType().name().equalsIgnoreCase(bankType))
                       .collect(Collectors.toList());
           }

           if (productType != null && !productType.isEmpty()) {
               allProducts = allProducts.stream()
                       .filter(product -> product.getProductType().equalsIgnoreCase(productType))
                       .collect(Collectors.toList());
           }

           if (sortBy != null && !sortBy.isEmpty()) {
               allProducts = sortProducts(allProducts, sortBy);
           }

           Map<String, Object> response = new HashMap<>();
           response.put("success", true);
           response.put("products", allProducts);
           response.put("count", allProducts.size());
           response.put("timestamp", new Date());

           return ResponseEntity.ok(response);

       } catch (Exception e) {
           log.error("Ошибка получения каталога: {}", e.getMessage());
           return ResponseEntity.badRequest().body(Map.of(
                   "success", false,
                   "error", e.getMessage()
           ));
       }
    }

    @GetMapping("/{clientId}")
    public ResponseEntity<Map<String, Object>> getClientProductList(
            @PathVariable String clientId,
            @RequestParam(required = false) String bankType,
            @RequestParam(required = false) String productType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy
    ) {
        try {
            List<Product> clientProducts = new ArrayList<>();
            for (BankType type: BankType.values()) {
                try {
                    var bankClient = bankService.getBankClient(type);
                    List<Product> bankProducts = bankClient.listClientProducts();
                    clientProducts.addAll(bankProducts);
                } catch (Exception e) {
                    log.warn("Не удалось получить продукты банка {}: {}", type, e.getMessage());
                }
            }

            if (bankType != null && !bankType.isEmpty()) {
                clientProducts = clientProducts.stream()
                        .filter(product -> product.getBankType().name().equalsIgnoreCase(bankType))
                        .collect(Collectors.toList());
            }

            if (productType != null && !productType.isEmpty()) {
                clientProducts = clientProducts.stream()
                        .filter(product -> product.getProductType().equalsIgnoreCase(productType))
                        .collect(Collectors.toList());
            }

            if (status != null && !status.isEmpty()) {
                clientProducts = clientProducts.stream()
                        .filter(product -> product.getStatus().equalsIgnoreCase(status))
                        .collect(Collectors.toList());
            }

            if (sortBy != null && !sortBy.isEmpty()) {
                clientProducts = sortProducts(clientProducts, sortBy);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("products", clientProducts);
            response.put("count", clientProducts.size());
            response.put("timestamp", new Date());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Ошибка получения списка продуктов: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /*
    Образец:
     curl.exe -X POST http://localhost:8090/api/v1/products/team086-3/buy -H "Content-Type: application/json" -H "Accept: application/json" -d '{\"bankType\": \"VBANK\", \"productId\": \"prod-vbank-deposit-001\", \"amount\": \"50000\", \"sourceAccountId\": \"4081781008603086687\"}'
     {"clientId":"team086-3","productId":"prod-vbank-deposit-001","success":true,"bankType":"VBANK","message":"Продукт успешно приобретен"}
    */
    @PostMapping("/{clientId}/buy")
    public ResponseEntity<Map<String, Object>> buyProduct(
            @PathVariable String clientId,
            @RequestBody Map<String, Object> requestBody
    ) {
        try {

            BankType bankType = BankType.valueOf((String) requestBody.get("bankType"));
            var bankClient = bankService.getBankClient(bankType);

            String productId = (String) requestBody.get("productId");
            BigDecimal amount = BigDecimal.valueOf(Double.parseDouble((String) requestBody.get("amount")));
            String sourceAccountId = (String) requestBody.get("sourceAccountId");

            Boolean success = bankClient.buyNewProduct(productId, amount, sourceAccountId);

            Map<String, Object> response = new HashMap<>();
            if (Boolean.TRUE.equals(success)) {
                response.put("success", true);
                response.put("message", "Продукт успешно приобретен");
                response.put("productId", productId);
                response.put("bankType", bankType);
                response.put("clientId", clientId);
                log.info("Клиент {} успешно приобрел продукт {} в банке {}",
                        clientId, productId, bankType);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "Не удалось приобрести продукт");
                log.warn("Не удалось приобрести продукт {} для клиента {}", productId, clientId);
                return ResponseEntity.badRequest().body(response);
            }

        } catch (IllegalArgumentException e) {
            log.error("Неверный тип банка: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Неверный тип банка: " + e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Ошибка при покупке продукта для клиента {}: {}", clientId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Ошибка при покупке продукта: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{clientId}/delete")
    public ResponseEntity<Map<String, Object>> deleteProduct(
            @PathVariable String clientId,
            @RequestBody Map<String, Object> requestBody
    ) {
        try {
            BankType bankType = BankType.valueOf((String) requestBody.get("bankType"));
            var bankClient = bankService.getBankClient(bankType);

            String agreementId = (String) requestBody.get("agreementId");
            String repaymentAccountId = (String) requestBody.get("repaymentAccountId");
            BigDecimal repaymentAmount = BigDecimal.valueOf(Double.parseDouble((String) requestBody.get("repaymentAmount")));

            Boolean success = bankClient.deleteSomeProduct(agreementId, repaymentAccountId, repaymentAmount);

            Map<String, Object> response = new HashMap<>();
            if (Boolean.TRUE.equals(success)) {
                response.put("success", true);
                response.put("message", "Продукт успешно удален");
                response.put("agreementId", agreementId);
                response.put("bankType", bankType);
                response.put("clientId", clientId);
                log.info("Клиент {} успешно удалил продукт {} в банке {}",
                        clientId, agreementId, bankType);
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "Не удалось удалить продукт");
                log.warn("Не удалось удалить продукт {} для клиента {}", agreementId, clientId);
                return ResponseEntity.badRequest().body(response);
            }

        } catch (IllegalArgumentException e) {
            log.error("Неверный тип банка: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Неверный тип банка: " + e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Ошибка при удалении продукта для клиента {}: {}", clientId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Ошибка при удалении продукта: " + e.getMessage()
            ));
        }
    }

    private List<Product> sortProducts(List<Product> products, String sortBy) {
        switch (sortBy) {
            case "interest_desc":
                return products.stream()
                        .sorted((p1, p2) -> compareInterestRates(p2, p1))
                        .collect(Collectors.toList());
            case "interest_asc":
                return products.stream()
                        .sorted(this::compareInterestRates)
                        .collect(Collectors.toList());
            case "name_desc":
                return products.stream()
                        .sorted(Comparator.comparing(Product::getProductName).reversed())
                        .collect(Collectors.toList());
            case "name_asc":
                return products.stream()
                        .sorted(Comparator.comparing(Product::getProductName))
                        .collect(Collectors.toList());
            case "bank":
                return products.stream()
                        .sorted(Comparator.comparing(product -> product.getBankType().name()))
                        .collect(Collectors.toList());
            default:
                return products;
        }
    }

    private int compareInterestRates(Product p1, Product p2) {
        try {
            double rate1 = p1.getInterestRate() != null ? Double.parseDouble(p1.getInterestRate()) : 0;
            double rate2 = p2.getInterestRate() != null ? Double.parseDouble(p2.getInterestRate()) : 0;
            return Double.compare(rate1, rate2);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

}
