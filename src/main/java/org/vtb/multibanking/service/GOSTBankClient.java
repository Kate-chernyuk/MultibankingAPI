package org.vtb.multibanking.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import org.vtb.multibanking.config.GOSTBankClientConfig;
import org.vtb.multibanking.model.Amount;
import org.vtb.multibanking.model.mobile.MobileProduct;
import org.vtb.multibanking.model.mobile.MobileProvider;
import org.vtb.multibanking.model.mobile.PhoneNumberInfo;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.*;

@Slf4j
public class GOSTBankClient {
    private final String gostBaseUrl;
    private final String authUrl;
    private final String clientId;
    private final String clientSecret;
    private final RestTemplate gostRestTemplate;

    private String currentToken;
    private Instant tokenExpiresAt;

   /* public GOSTBankClient(String gostBaseUrl, String authUrl, String clientId, String clientSecret) {
        this.gostBaseUrl = gostBaseUrl;
        this.authUrl = authUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.gostRestTemplate = new RestTemplate();
    }
*/
    public GOSTBankClient(GOSTBankClientConfig gostBankClientConfig) {
        this.gostBaseUrl = gostBankClientConfig.getApi().getGostBaseUrl();
        this.authUrl = gostBankClientConfig.getApi().getAuthUrl();
        this.clientId = gostBankClientConfig.getApi().getClientId();
        this.clientSecret = gostBankClientConfig.getApi().getClientSecret();
        this.gostRestTemplate = new RestTemplate();
    }

    private String getGOSTToken() {
        if (currentToken != null && tokenExpiresAt != null &&
                Instant.now().isBefore(tokenExpiresAt)) {
            return currentToken;
        }

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        httpHeaders.setAccept(List.of(MediaType.APPLICATION_JSON));

        String requestBody = "grant_type=client_credentials&client_id=" + clientId + "&client_secret=" + clientSecret;

        try {
            ResponseEntity<Map> responseEntity = gostRestTemplate.exchange(
                    authUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                currentToken = (String) responseEntity.getBody().get("access_token");
                Integer expiresIn = (Integer) responseEntity.getBody().get("expires_in");
                tokenExpiresAt = Instant.now().plusSeconds(expiresIn != null ? expiresIn - 60 : 3500);

                log.info("Успешно получен гост-токен");
                return currentToken;
            }
        } catch (Exception e) {
            log.error("Не удалось получить гост-токен: {}", e.getMessage());
        }
        throw new RuntimeException("Не удалось получить гост-токен");
    }

    public List<MobileProduct> getMobileProducts() {
        String mobileProductsUrl = gostBaseUrl + "/api/rb/pmnt/acceptance/mobile/hackathon/v1/products";

        Map<String, Object> requestBody = Map.of(
                "paySum", Map.of(
                        "amount", 100000,
                        "currency", Map.of(
                                "code", "RUB"
                        )
                )

        );

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(getGOSTToken());
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        httpHeaders.setAccept(List.of(MediaType.APPLICATION_JSON));
        httpHeaders.set("X-MDM-ID", clientId);

        try {
            ResponseEntity<Map> responseEntity = gostRestTemplate.exchange(
                    mobileProductsUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> bodyMap = responseEntity.getBody();
                List<MobileProduct> mobileProducts = new ArrayList<>();

                findAndParseProducts(bodyMap, mobileProducts);

                log.info("Успешно получено {} мобильных продуктов", mobileProducts.size());
                return mobileProducts;
            }

        } catch (Exception e) {
            log.error("Ошибка при получении списка доступных мобильных продуктов: {}", e.getMessage());
        }
        return List.of();
    }

    public PhoneNumberInfo getInfoAboutPhoneNumber(String number) {
        String phoneInfoUrl = gostBaseUrl + "/api/rb/pmnt/acceptance/mobile/hackathon/v1/phones/info";

        Map<Object, String> requestBody = Map.of(
                "number", number
        );

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(getGOSTToken());
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        httpHeaders.setAccept(List.of(MediaType.APPLICATION_JSON));

        try {
            ResponseEntity<Map> responseEntity = gostRestTemplate.exchange(
                    phoneInfoUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> phoneData = (Map<String, Object>) responseEntity.getBody();
                PhoneNumberInfo info = parsePhoneNumberInfo(phoneData);
                log.info("Получена информация о номере {}: {}", number, info);
                return info;
            }
        } catch (Exception e) {
            log.error("Не удалось получить информацию о телефоне {}: {}", number, e.getMessage());
        }
        return new PhoneNumberInfo();
    }

    private PhoneNumberInfo parsePhoneNumberInfo(Map<String, Object> phoneData) {
        PhoneNumberInfo phoneNumberInfo = new PhoneNumberInfo();

        phoneNumberInfo.setNumber(safeToString(phoneData.get("number")));

        Map<String, Object> paymentOptions = (Map<String, Object>) phoneData.get("paymentOptions");
        Map<String, Object> paySumLimit = (Map<String, Object>) paymentOptions.get("paySumLimit");

        Map<String, Object> minSumData = (Map<String, Object>) paySumLimit.get("minSum");
        Amount minSum = parseAmount(minSumData);
        phoneNumberInfo.setMinSum(minSum);

        Map<String, Object> maxSumData = (Map<String, Object>) paySumLimit.get("maxSum");
        Amount maxSum = parseAmount(maxSumData);
        phoneNumberInfo.setMaxSum(maxSum);

        List<Map<String, Object>> recommendedSumsData =
                (List<Map<String, Object>>) paymentOptions.get("recommendedSums");
        List<Amount> recommendedSums = new ArrayList<>();

        for (Map<String, Object> sumData : recommendedSumsData) {
            Amount amount = parseAmount(sumData);
            recommendedSums.add(amount);
        }

        phoneNumberInfo.setRecommendedSums(recommendedSums);

        Map<String, Object> providerData = (Map<String, Object>) phoneData.get("serviceProvider");
        MobileProvider provider = parseMobileProvider(providerData);
        phoneNumberInfo.setMobileProvider(provider);

        return phoneNumberInfo;
    }

    public String requestPayment(
            String serviceProviderId, String clientProductId,
            String clientProductType, String mobileNumber,
            BigDecimal amount, String currencyCode
    ) {
        String requestPaymentUrl = gostBaseUrl + "/api/rb/pmnt/acceptance/mobile/hackathon/v1/payments/request";

        Map<String, Object> requestBody = Map.of(
                "serviceProviderId", serviceProviderId,
                "clientProduct", Map.of(
                        "id", clientProductId,
                        "type", clientProductType
                ),
                "mobileNumber", Map.of("number", mobileNumber),
                "paySum", Map.of(
                        "amount", amount,
                        "currency", Map.of("code", currencyCode)
                )
        );

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(getGOSTToken());
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        httpHeaders.setAccept(List.of(MediaType.APPLICATION_JSON));
        httpHeaders.set("X-UNC", clientId);
        httpHeaders.set("X-MDM-ID", clientId);
        httpHeaders.set("X-CLIENT-CHANNEL", clientId);
        httpHeaders.set("X-TB-ID", clientId);

        try {
            ResponseEntity<Map> response = gostRestTemplate.exchange(
                    requestPaymentUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                log.info("Успешно создан запрос на оплату для номера {}: {}", mobileNumber, result);
                String transactionId = (String) result.get("transactionId");
                return transactionId;
            }

        } catch (Exception e) {
            log.error("Ошибка при создании запроса на оплату: {}", e.getMessage());
        }
        return null;
    }

    public void confirmPayment(String paymentId, String purpose, String code) {
        String confirmPaymentUrl = gostBaseUrl + "/api/rb/pmnt/acceptance/mobile/hackathon/v1/payments/confirm";

        Map<String, Object> requestBody = Map.of(
                "id", paymentId,
                "clientApprove", Map.of(
                        "purpose", purpose,
                        "code", code
                )
        );

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(getGOSTToken());
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        httpHeaders.setAccept(List.of(MediaType.APPLICATION_JSON));
        httpHeaders.set("X-UNC", clientId);
        httpHeaders.set("X-MDM-ID", clientId);
        httpHeaders.set("X-CLIENT-CHANNEL", clientId);
        httpHeaders.set("X-TB-ID", clientId);
        httpHeaders.set("x-user-session-id", paymentId);

        try {
            ResponseEntity<Map> responseEntity = gostRestTemplate.exchange(
                    confirmPaymentUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> result = responseEntity.getBody();
                log.info("Успешно подтвержден платеж {}: {}", paymentId, result);
            }
        } catch (Exception e) {
            log.error("Ошибка при подтверждении платежа {}: {}", paymentId, e.getMessage());
        }
    }

    public boolean startPayment(String serviceProviderId) {
        String startPaymentUrl = gostBaseUrl + "/api/rb/pmnt/acceptance/mobile/hackathon/v1/payments/start";

        Map<String, Object> requestBody = Map.of("serviceProviderId", serviceProviderId);

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(getGOSTToken());
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        httpHeaders.setAccept(List.of(MediaType.APPLICATION_JSON));

        try {
            ResponseEntity<Map> response = gostRestTemplate.exchange(
                    startPaymentUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                log.info("Успешно запущен процесс платежа для провайдера {}: {}", serviceProviderId, result);
                return true;
            }

        } catch (Exception e) {
            log.error("Ошибка при запуске процесса платежа: {}", e.getMessage());
        }
        return false;
    }

    public Map<String, Object> getPayment(String paymentId) {
        String getPaymentUrl = gostBaseUrl + "/api/rb/pmnt/acceptance/mobile/hackathon/v1//payments/" + paymentId;

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(getGOSTToken());
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        httpHeaders.setAccept(List.of(MediaType.APPLICATION_JSON));

        try {
            ResponseEntity<Map> response = gostRestTemplate.exchange(
                    getPaymentUrl, HttpMethod.GET, new HttpEntity<>(httpHeaders), Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                log.info("Успешно получена информация о платеже {}: {}", paymentId, result);
                return result;
            }

        } catch (Exception e) {
            log.error("Ошибка при получении информации о платеже {}: {}", paymentId, e.getMessage());
        }
        return Map.of();
    }

    private MobileProvider parseMobileProvider(Map<String, Object> providerData) {
        MobileProvider mobileProvider = new MobileProvider();

        mobileProvider.setId(safeToString(providerData.get("id")));
        mobileProvider.setName(safeToString(providerData.get("name")));
        mobileProvider.setType(safeToString(providerData.get("type")));
        mobileProvider.setShortName(safeToString(providerData.get("shortName")));

        return mobileProvider;
    }

    private void findAndParseProducts(Object data, List<MobileProduct> result) {
        if (data instanceof Map) {
            Map<String, Object> mapData = (Map<String, Object>) data;

            for (Object value: mapData.values()) {
                if (value instanceof List) {
                    List<?> list = (List<?>) value;
                    for (Object item: list) {
                        if (item instanceof Map) {
                            try {
                                MobileProduct product = parseProduct((Map<String, Object>) item);
                                if (isValidProduct(product)) {
                                    result.add(product);
                                }
                            } catch (Exception e) {
                                log.warn("Ошибка парсинга продукта: {}", e.getMessage());
                            }
                        }
                    }
                } else {
                    findAndParseProducts(value, result);
                }
            }
        } else if (data instanceof List) {
            List<?> list = (List<?>) data;
            for (Object item : list) {
                findAndParseProducts(item, result);
            }
        }
    }

    private MobileProduct parseProduct(Map<String, Object> productData) {
        MobileProduct mobileProduct = new MobileProduct();

        for (Map.Entry<String, Object> entry : productData.entrySet()) {
            switch (entry.getKey()) {
                case "entityName":
                    mobileProduct.setEntityName(safeToString(entry.getValue()));
                    break;
                case "alias":
                    mobileProduct.setAlias(safeToString(entry.getValue()));
                    break;
                case "publicId":
                    mobileProduct.setPublicId(safeToString(entry.getValue()));
                    break;
                case "productType":
                    mobileProduct.setProductType(safeToString(entry.getValue()));
                    break;
                case "balance":
                    if (entry.getValue() instanceof Map) {
                        Map<String, Object> balanceData = (Map<String, Object>) entry.getValue();
                        Amount amount = parseAmount(balanceData);
                        mobileProduct.setAmount(amount);
                    }
                    break;
                default:
                    log.debug("Необработанный ключ продукта: {} = {}", entry.getKey(), entry.getValue());
            }
        }

        return mobileProduct;
    }

    private Amount parseAmount(Map<String, Object> balanceData) {
        Amount amount = new Amount();

        for (Map.Entry<String, Object> entry : balanceData.entrySet()) {
            switch (entry.getKey()) {
                case "amount":
                    Object amountValue = entry.getValue();
                    amount.setAmount(String.valueOf(amountValue));
                    break;
                case "currency":
                    if (entry.getValue() instanceof Map) {
                        Map<String, Object> currencyData = (Map<String, Object>) entry.getValue();
                        if (currencyData.containsKey("code")) {
                            amount.setCurrency(safeToString(currencyData.get("code")));
                        }
                    }
                    break;
            }
        }

        return amount;
    }

    private String safeToString(Object value) {
        return value != null ? value.toString() : null;
    }

    private boolean isValidProduct(MobileProduct product) {
        return product.getPublicId() != null && product.getProductType() != null;
    }

}
