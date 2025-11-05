package org.vtb.multibanking.service.bank;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.RestTemplate;
import org.vtb.multibanking.model.*;
import org.vtb.multibanking.model.events.AccountEvent;
import org.vtb.multibanking.model.events.ProductEvent;
import org.vtb.multibanking.service.integration.BankEventPublisher;
import org.vtb.multibanking.service.ConsentService;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
public abstract class AbstractBankClient implements BankClient {

    protected final String baseUrl;
    protected final String clientId;
    protected final String clientSecret;
    protected final RestTemplate restTemplate;
    protected final String userId;

    private String currentToken;
    private Instant tokenExpiresAt;

    private final ConsentService consentService;
    private String consent;
    private final BankEventPublisher bankEventPublisher;

    public AbstractBankClient(String baseUrl, String clientId, String clientSecret, String userId, ConsentService consentService, BankEventPublisher bankEventPublisher) {
        this.baseUrl = baseUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.userId = userId;
        this.restTemplate = new RestTemplate();
        this.consentService = consentService;
        this.bankEventPublisher = bankEventPublisher;
        this.restTemplate.setErrorHandler(new DefaultResponseErrorHandler());
    }

    protected String getToken() {
        if (currentToken != null && tokenExpiresAt != null && Instant.now().isBefore(tokenExpiresAt)) {
            return currentToken;
        }

        String tokenUrl = baseUrl + "/auth/bank-token?client_id=" + clientId + "&client_secret=" + clientSecret;

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.set("accept", "application/json");

        ResponseEntity<Map> responseEntity = restTemplate.exchange(
                tokenUrl, HttpMethod.POST, new HttpEntity<>(httpHeaders), Map.class
        );

        if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
            currentToken = (String) responseEntity.getBody().get("access_token");
            tokenExpiresAt = Instant.now().plusSeconds(23 * 60 * 60);

            return  currentToken;
        }
        throw new RuntimeException("Ошибка получения токена для банка " + getBankType());
    }

    protected void createConsent() throws Exception {
        Optional<String> existingConsentOpt = consentService.getActiveConsentId(getBankType(), userId);
        if (existingConsentOpt.isPresent()) {
            String existingConsentId = existingConsentOpt.get();
            log.info("Действующее согласие уже существует для банка {}: {}", getBankType().toString(), existingConsentId);
            this.consent = existingConsentId;
            return;
        }

        Optional<String> pendingRequestOpt = consentService.getPendingRequestId(getBankType(), userId);
        if (pendingRequestOpt.isPresent()) {
            String pendingRequestId = pendingRequestOpt.get();
            log.info("Найдено pending согласие для банка {}. Проверяем статус: {}", getBankType().toString(), pendingRequestId);

            checkConsentStatus(pendingRequestId);

            Optional<String> updatedConsentOpt = consentService.getActiveConsentId(getBankType(), userId);
            if (updatedConsentOpt.isPresent()) {
                log.info("Согласие стало активным после проверки: {}", updatedConsentOpt.get());
                this.consent = updatedConsentOpt.get();
                return;
            } else {
                log.info("Согласие все еще в статусе pending. Используем существующий requestId: {}", pendingRequestId);
                return;
            }
        }
        log.info("Создаем новое согласие для банка {}", getBankType().toString());

        String consentUrl = baseUrl + "/account-consents/request";

        Map<String, Object> requestBody = Map.of(
                "client_id", userId,
                "permissions", List.of("ReadAccountsDetail", "ReadBalances", "ReadTransactionsDetail"),
                "reason", "",
                "requesting_bank", "test_bank",
                "requesting_bank_name", "Test Bank"
        );

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");
        httpHeaders.set("x-requesting-bank", clientId);
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    consentUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                String status = (String) responseEntity.getBody().get("status");
                if (status.equals("approved")) {
                    String consentId = (String) responseEntity.getBody().get("consent_id");
                    consentService.saveConsent(getBankType(), userId, consentId, null, "approved");
                    this.consent = consentId;
                    log.info("Успешно получено согласие для банка {}: {}", getBankType().toString(), consentId);
                    return;
                } else if (status.equals("pending")) {
                    String requestId = (String) responseEntity.getBody().get("request_id");
                    consentService.saveConsent(getBankType(), userId, null, requestId, "pending");
                    log.info("Запрос отправлен на одобрение в банк {}: {}", getBankType().toString(), requestId);
                    Thread.sleep(5000);
                    checkConsentStatus(requestId);
                    return;
                }
            }
        } catch (Exception e) {
            log.error("Ошибка получения согласия для банка {}: {}", getBankType().toString(), e.getMessage());
            throw e;
        }

        throw new RuntimeException("Ошибка получения согласия для банка " + getBankType());
    }

    protected void checkConsentStatus(String requestId) {
        String token = getToken();
        String statusUrl = baseUrl + "/account-consents/" + requestId;

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(token);
        httpHeaders.set("accept", "application/json");
        httpHeaders.set("x-fapi-interaction-id", clientId);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    statusUrl, HttpMethod.GET, new HttpEntity<>(httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) responseEntity.getBody().get("data");
                if (data != null) {
                    String status = (String) data.get("status");
                    if ("Authorized".equals(status) || "approved".equals(status)) {
                        String consentId = (String) data.get("consentId");
                        consentService.updateConsentStatus(getBankType(), userId, "approved", consentId);
                        log.info("Согласие успешно авторизовано для банка {}: {}", getBankType().toString(), consentId);
                    } else {
                        log.info("Статус согласия: {}. Пожалуйста, перейдите в ЛК банка {} и дайте согласие",
                                status, getBankType().toString());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Ошибка проверки статуса согласия: {}", e.getMessage());
        }
    }

    public List<Account> fetchAccounts() throws Exception {
        this.currentToken = getToken();

        Optional<String> activeConsentOpt = consentService.getActiveConsentId(getBankType(), userId);
        if (activeConsentOpt.isEmpty()) {
            createConsent();

            activeConsentOpt = consentService.getActiveConsentId(getBankType(), userId);
            if (activeConsentOpt.isEmpty()) {
                Optional<String> pendingRequestOpt = consentService.getPendingRequestId(getBankType(), userId);
                if (pendingRequestOpt.isPresent()) {
                    checkConsentStatus(pendingRequestOpt.get());
                    activeConsentOpt = consentService.getActiveConsentId(getBankType(), userId);
                }
            }

            if (activeConsentOpt.isEmpty()) {
                throw new Exception("Не удалось получить действующее согласие для банка " + getBankType());
            }
        }

        this.consent = activeConsentOpt.get();

        List<Account> accounts = getAccountList();
        for (Account account: accounts) {
            try {
                List<Balance> balances = getAccountBalances(account.getAccountId());
                List<Transaction> transactions = getAccountTransactions(account.getAccountId());
                updateAccountWithBalances(account, balances);
                account.getTransactions().addAll(transactions);

            } catch (Exception e) {
                log.error("Ошибка при сопоставлении аккаунтов и балансов: {}", e.getMessage());
                throw e;
            }
        }

        return accounts;
    }

    protected List<Account> getAccountList() throws Exception {
        if (consent == null) {
            throw new Exception("Нет согласия на обработку данных из банка " + getBankType().toString());
        }

        String accountUrl = baseUrl + "/accounts?client_id=" + userId;

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");
        httpHeaders.set("x-consent-id", consent);
        httpHeaders.set("x-requesting-bank", clientId);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    accountUrl, HttpMethod.GET, new HttpEntity<>(httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) responseEntity.getBody().get("data");
                if (data != null) {
                    List<Map<String, Object>> accountsData = (List<Map<String, Object>>) data.get("account");
                    if (accountsData != null) {
                        return accountsData.stream()
                                .map(this::mapToAccount)
                                .collect(Collectors.toList());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Ошибка получения информации из банка {}: {}", getBankType().toString(), e.getMessage());
            throw e;
        }

        return List.of();
    }

    protected List<Balance> getAccountBalances(String accountId) {
        String balancesUrl = baseUrl + "/accounts/" + accountId + "/balances";

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");
        httpHeaders.set("x-consent-id", consent);
        httpHeaders.set("x-requesting-bank", clientId);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    balancesUrl, HttpMethod.GET, new HttpEntity<>(httpHeaders), Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                if (data != null) {
                    List<Map<String, Object>> balancesData = (List<Map<String, Object>>) data.get("balance");
                    if (balancesData != null) {
                        return balancesData.stream()
                                .map(this::mapToBalance)
                                .collect(Collectors.toList());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Ошибка получения информации из банка {}: {}", getBankType().toString(), e.getMessage());
            throw e;
        }
        return List.of();
    }

    protected List<Transaction> getAccountTransactions(String accountId) {
        String transactionUrl = baseUrl + "/accounts/" + accountId + "/transactions";

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");
        httpHeaders.set("x-consent-id", consent);
        httpHeaders.set("x-requesting-bank", clientId);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    transactionUrl, HttpMethod.GET, new HttpEntity<>(httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) responseEntity.getBody().get("data");
                if (data != null) {
                    List<Map<String, Object>> transactionData = (List<Map<String, Object>>) data.get("transaction");
                    if (transactionData != null) {
                        return transactionData.stream()
                                .map(this::mapToTransaction)
                                .collect(Collectors.toList());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Ошибка получения транзакций для счета {}: {}", accountId, e.getMessage());
        }

        return List.of();
    }

    private Account mapToAccount(Map<String, Object> accountData) {
        Account account = new Account();
        account.setAccountId((String) accountData.get("accountId"));
        account.setStatus((String) accountData.get("status"));
        account.setCurrency((String) accountData.get("currency"));
        account.setAccountType((String) accountData.get("accountType"));
        account.setAccountSubType((String) accountData.get("accountSubType"));
        account.setNickname((String) accountData.get("nickname"));
        account.setOpeningDate((String) accountData.get("openingDate"));

        List<Map<String, Object>> identificationsData = (List<Map<String, Object>>) accountData.get("account");
        if (identificationsData != null) {
            List<AccountIdentification> identifications = identificationsData.stream()
                    .map(this::mapToAccountIdentification)
                    .collect(Collectors.toList());
            account.setAccountIdentifications(identifications);
        }

        account.setBank(getBankType());

        return account;
    }

    private AccountIdentification mapToAccountIdentification(Map<String, Object> identificationData) {
        return new AccountIdentification(
                (String) identificationData.get("schemeName"),
                (String) identificationData.get("identification"),
                (String) identificationData.get("name")
        );
    }

    private Balance mapToBalance(Map<String, Object> balanceData) {
        Balance balance = new Balance();
        balance.setAccountId((String) balanceData.get("accountId"));
        balance.setType((String) balanceData.get("type"));
        balance.setCreditDebitIndicator((String) balanceData.get("creditDebitIndicator"));

        String dateTimeStr = (String) balanceData.get("dateTime");
        if (dateTimeStr != null) {
            try {
                balance.setDateTime(Instant.parse(dateTimeStr));
            } catch (Exception e) {
                log.error("Ошибка при парсинге даты: {}", dateTimeStr);
            }
        }

        Map<String, Object> amountData = (Map<String, Object>) balanceData.get("amount");
        if (amountData != null) {
            Amount amount = new Amount(
                    (String) amountData.get("amount"),
                    (String) amountData.get("currency")
            );
            balance.setAmount(amount);
        }

        return balance;
    }

    private Transaction mapToTransaction(Map<String, Object> transactionData) {
        Transaction transaction = new Transaction();
        transaction.setAccountId((String) transactionData.get("accountId"));
        transaction.setTransactionId((String) transactionData.get("transactionId"));
        transaction.setCreditDebitIndicator((String) transactionData.get("creditDebitIndicator"));
        transaction.setStatus((String) transactionData.get("status"));
        transaction.setTransactionInformation((String) transactionData.get("transactionInformation"));

        String bookingDateTimeStr = (String) transactionData.get("bookingDateTime");
        String valueDateTimeStr = (String) transactionData.get("valueDateTime");

        if (bookingDateTimeStr != null) {
            try {
                transaction.setBookingDateTime(Instant.parse(bookingDateTimeStr));
            } catch (Exception e) {
                log.error("Ошибка парсинга bookingDateTime: {}", bookingDateTimeStr);
            }
        }

        if (valueDateTimeStr != null) {
            try {
                transaction.setValueDateTime(Instant.parse(valueDateTimeStr));
            } catch (Exception e) {
                log.error("Ошибка парсинга valueDateTime: {}", valueDateTimeStr);
            }
        }

        Map<String, Object> amountData = (Map<String, Object>) transactionData.get("amount");
        if (amountData != null) {
            Amount amount = new Amount();
            amount.setAmount((String) amountData.get("amount"));
            amount.setCurrency((String) amountData.get("curremcy"));
            transaction.setAmount(amount);
        }

        Map<String, Object> codeData = (Map<String, Object>) transactionData.get("bankTransactionCode");
        if (codeData != null) {
            BankTransactionCode code = new BankTransactionCode();
            code.setCode((String) codeData.get("code"));
            transaction.setBankTransactionCode(code);
        }

        return transaction;
    }

    private void updateAccountWithBalances(Account account, List<Balance> balances) {
        for (Balance balance : balances) {
            if (balance.isAvailableBalance()) {
                account.setAvailableBalance(balance.getAmount().getAmountValue());
            } else if (balance.isCurrentBalance()) {
                account.setCurrentBalance(balance.getAmount().getAmountValue());
                account.setLastUpdated(balance.getDateTime());
            }
        }
    }

    protected String getPaymentConsent(String debtorAccount, Integer amount) {
        String consentUrl = baseUrl + "/payment-consents/request";

        Map<String, Object> requestBody = Map.of(
                "client_id", userId,
                "requesting_bank", clientId,
                "consent_type", "single_use",
                "debtor_account", debtorAccount,
                "amount", amount
        );

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");
        httpHeaders.set("x-requesting-bank", clientId);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    consentUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                if (responseEntity.getBody().get("status").equals("approved")) {
                    return (String) responseEntity.getBody().get("consent_id");
                }
            }
        } catch (Exception e) {
            log.error("Не удалось получить согласие на исполнение платежа {}", e.getMessage());
        }
        return null;
    }

    public String createPayment(String debtorAccount, String creditorAccount, Amount amount, BankType bankType) throws Exception {
        this.currentToken = getToken();
        String consent = getPaymentConsent(debtorAccount, Integer.valueOf(String.valueOf(amount.getAmount())));
        String paymentUrl = baseUrl + "/payments?client_id=" + userId;

        Map<String, Object> requestBody = Map.of(
                "data", Map.of(
                        "initiation", Map.of(
                                "instructedAmount", Map.of(
                                        "amount", amount.getAmount(),
                                        "currency", "RUB"
                                ),
                                "debtorAccount", Map.of(
                                        "schemeName", "RU.CBR.PAN",
                                        "identification", debtorAccount
                                ),
                                "creditorAccount", Map.of(
                                        "schemeName", "RU.CBR.PAN",
                                        "identification", creditorAccount,
                                        "bank_code", bankType.toString().toLowerCase()
                                )
                        )
                )
        );

        log.info(requestBody.toString());


        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");
        httpHeaders.set("client_id", userId);
        httpHeaders.set("x-requesting-bank", clientId);
        httpHeaders.set("x-payment-consent-id", consent);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    paymentUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) responseEntity.getBody().get("data");
                if (data != null) {
                    String paymentId = (String) data.get("paymentId");

                    Transaction paymentTransaction = createPaymentTransaction(debtorAccount, amount, paymentId);
                    bankEventPublisher.publishTransactionEvent(paymentTransaction, userId);

                    return paymentId;
                }
            }
        } catch (Exception e) {
            log.error("Не удалось исполненить платёж {}", e.getMessage());
        }
        return null;
    }

    private Transaction createPaymentTransaction(String debtorAccount, Amount amount, String paymentId) {
        Transaction transaction = new Transaction();
        transaction.setTransactionId(paymentId);
        transaction.setAccountId(debtorAccount);
        transaction.setAmount(amount);
        transaction.setCreditDebitIndicator("Debit");
        transaction.setStatus("Booked");
        transaction.setTransactionInformation("Payment");
        transaction.setBookingDateTime(Instant.now());
        transaction.setValueDateTime(Instant.now());

        return transaction;
    }

    public List<Product> getProductsCatalog() {
        this.currentToken = getToken();
        String catalogUrl = baseUrl + "/products";

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    catalogUrl, HttpMethod.GET, new HttpEntity<>(httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) responseEntity.getBody().get("data");
                if (data != null) {
                    List<Map<String, Object>> productsData = (List<Map<String, Object>>) data.get("product");
                    if (productsData != null) {
                        return productsData.stream()
                                .map(this::mapToProduct)
                                .collect(Collectors.toList());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Не удалось раздобыть катоалог продуктов банка {}: {}", getBankType(), e.getMessage());
        }
        return List.of();
    }

    private Product mapToProduct(Map<String, Object> productData) {
        Product product = new Product();

        product.setProductId(productData.containsKey("productId") ? (String) productData.get("productId") : (String) productData.get("product_id"));
        product.setProductType(productData.containsKey("productType") ? (String) productData.get("productType") : (String) productData.get("product_type"));
        product.setProductName(productData.containsKey("productName") ? (String) productData.get("productName") : (String) productData.get("product_name"));
        product.setDescription(productData.containsKey("description") ? (String) productData.get("description") : null);
        product.setInterestRate(productData.containsKey("interestRate") ? (String) productData.get("interestRate") : null);
        product.setMinAmount(productData.containsKey("minAmount") ? (String) productData.get("minAmount") : Double.toString((Double) productData.get("amount")));
        product.setMaxAmount(productData.containsKey("maxAmount") ? (String) productData.get("maxAmount") : Double.toString((Double) productData.get("amount")));
        product.setTermMonth(productData.containsKey("termMonths") ? (Integer) productData.get("termMonths") : null);
        product.setAgreementId(productData.containsKey("agreement_id") ? (String) productData.get("agreement_id") : null);
        product.setStatus(productData.containsKey("status") ? (String) productData.get("status") : null);
        product.setBankType(getBankType());

        return product;
    }

    public Account createAccount(String accountType, BigDecimal initialBalance) throws Exception {
        this.currentToken = getToken();
        Optional<String> activeConsent = consentService.getActiveConsentId(getBankType(), userId);
        if (activeConsent.isEmpty()) {
            createConsent();

            activeConsent = consentService.getActiveConsentId(getBankType(), userId);

            if (activeConsent.isEmpty()) {
                throw new Exception("Не удалось получить действующее согласие для банка " + getBankType());
            }
        }

        this.consent = activeConsent.get();
        String createAccountUrl = baseUrl + "/accounts";

        Map<String, Object> requestBody = Map.of(
                "account_type", accountType,
                "initial_balance", initialBalance
        );

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");
        httpHeaders.set("x-consent-id", consent);
        httpHeaders.set("x-requesting-bank", clientId);
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    createAccountUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            log.info(responseEntity.toString());

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                Map<String, Object> accountData = (Map<String, Object>) responseEntity.getBody();

                Account newAccount = mapToAccount(accountData);

                bankEventPublisher.publishAccountEvent(
                        newAccount, userId, AccountEvent.AccountEventType.OPENED
                );

                log.info("Счет успешно создан: {} для пользователя {}", newAccount.getAccountId(), userId);
                return newAccount;
            }
        } catch (Exception e) {
            log.error("Ошибка при создании счета: {}", e.getMessage());
            throw e;
        }

        throw new RuntimeException("Не удалось создать счет в банке " + getBankType());
    }

    private void createProductAgreementConsent() {
        this.currentToken = getToken();
        String consentUrl = baseUrl + "/product-agreement-consents/request?client_id=" + userId;

        Map <String, Object> requestBody = Map.of(
                "requesting_bank", clientId,
                "client_id", userId,
                "read_product_agreements", true,
                "open_product_agreements", true,
                "close_product_agreements", true,
                "allowed_product_types", List.of("deposit", "loan", "card", "account"),
                "max_amount", 1000000.00,
                "reason", "Финансовый агрегатор для управления продуктами"
        );

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);
        httpHeaders.set("client_id", userId);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    consentUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                String status = (String) responseEntity.getBody().get("status");
                if ("approved".equals(status)) {
                    String consentId = (String) responseEntity.getBody().get("consent_id");
                    consentService.saveProductConsent(
                            getBankType(),
                            userId,
                            consentId,
                            "approved",
                            BigDecimal.valueOf(1000000.00)
                    );
                    log.info("Получено продуктовое согласие для банка {} от клиента {}: {}", getBankType(), userId, consentId);
                }
            }
        } catch (Exception e) {
            log.error("Не удалось получить продуктовое согласие для банка {} от клиента {}", getBankType(), userId);
        }
    }

    public boolean getProduct(String productId, BigDecimal amount, String sourceAccountId) throws Exception {
        this.currentToken = getToken();

        Optional<String> activeProductConsent = consentService.getActiveProductConsentId(getBankType(), userId);
        if (activeProductConsent.isEmpty()) {
            createProductAgreementConsent();

            activeProductConsent = consentService.getActiveProductConsentId(getBankType(), userId);

            if (activeProductConsent.isEmpty()) {
                throw new Exception("Не удалось получить действующее согласие для банка " + getBankType());
            }
        }

        String getProductUrl = baseUrl + "/product-agreements?client_id=" + userId;

        Map<String, Object> requestBody = Map.of(
                "product_id", productId,
                "amount", amount,
                "source_account_id", sourceAccountId
        );

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");
        httpHeaders.set("client_id", userId);
        httpHeaders.set("x-product-agreement-consent-id", activeProductConsent.get());
        httpHeaders.set("x-requesting-bank", clientId);
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    getProductUrl, HttpMethod.POST, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                log.info("Продукт {} успешно приобретён", productId);
                List<Product> userProducts = getUserProductList();
                userProducts.stream()
                        .filter(product -> productId.equals(product.getProductId()))
                        .findFirst()
                        .ifPresent(product -> {
                            bankEventPublisher.publishProductEvent(
                                    product, userId, ProductEvent.ProductEventType.PURCHASED
                            );
                        });
                return true;
            }

            return false;

        } catch (Exception e) {
            log.error("Не удалось приобрести продукт {}: {}", productId, e.getMessage());
            return false;
        }
    }

    public List<Product> getUserProductList() throws Exception {
        this.currentToken = getToken();

        Optional<String> activeProductConsent = consentService.getActiveProductConsentId(getBankType(), userId);
        if (activeProductConsent.isEmpty()) {
            createProductAgreementConsent();

            activeProductConsent = consentService.getActiveProductConsentId(getBankType(), userId);

            if (activeProductConsent.isEmpty()) {
                throw new Exception("Не удалось получить действующее согласие для банка " + getBankType());
            }
        }

        String getProductListUrl = baseUrl + "/product-agreements?client_id=" + userId;

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");
        httpHeaders.set("client_id", userId);
        httpHeaders.set("x-product-agreement-consent-id", activeProductConsent.get());
        httpHeaders.set("x-requesting-bank", clientId);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    getProductListUrl, HttpMethod.GET, new HttpEntity<>(httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                List<Map<String, Object>> productsData = (List<Map<String, Object>>) responseEntity.getBody().get("data");
                if (productsData != null) {
                    return productsData.stream()
                            .map(this::mapToProduct)
                            .collect(Collectors.toList());
                }
            }
        } catch (Exception e) {
            log.error("Не удалось раздобыть каталог продуктов банка {}: {}", getBankType(), e.getMessage());
        }
        return List.of();
    }

    public boolean deleteProduct(String agreementId, String repaymentAccountId, BigDecimal repaymentAmount) throws Exception {
        this.currentToken = getToken();

        Optional<String> activeProductConsent = consentService.getActiveProductConsentId(getBankType(), userId);
        if (activeProductConsent.isEmpty()) {
            createProductAgreementConsent();

            activeProductConsent = consentService.getActiveProductConsentId(getBankType(), userId);

            if (activeProductConsent.isEmpty()) {
                throw new Exception("Не удалось получить действующее согласие для банка " + getBankType());
            }
        }

        String deleteProductUrl = baseUrl + "/product-agreements/" + agreementId + "?client_id=" + userId;

        Map<String, Object> requestBody = Map.of(
                "repayment_account_id", repaymentAccountId,
                "repayment_amount", repaymentAmount
        );

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(currentToken);
        httpHeaders.set("accept", "application/json");
        httpHeaders.set("agreement_id", agreementId);
        httpHeaders.set("client_id", userId);
        httpHeaders.set("x-product-agreement-consent-id", activeProductConsent.get());
        httpHeaders.set("x-requesting-bank", clientId);
        httpHeaders.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    deleteProductUrl, HttpMethod.DELETE, new HttpEntity<>(requestBody, httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                log.info("Продукт успешно удалён");
                return true;
            }

            return false;

        } catch (Exception e) {
            log.error("Не удалось удалить продукт {}: {}", agreementId, e.getMessage());
            return false;
        }
    }

    protected String getCurrentUserId() {
        return this.userId;
    }

}