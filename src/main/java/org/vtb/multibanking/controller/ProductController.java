package org.vtb.multibanking.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.model.Product;
import org.vtb.multibanking.service.bank.BankService;

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
           log.error("Ошибка платежа: {}", e.getMessage());
           return ResponseEntity.badRequest().body(Map.of(
                   "success", false,
                   "error", e.getMessage()
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
