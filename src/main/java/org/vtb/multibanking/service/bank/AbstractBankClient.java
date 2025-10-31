package org.vtb.multibanking.service.bank;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.RestTemplate;
import org.vtb.multibanking.model.*;
import org.vtb.multibanking.service.ConsentService;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
public abstract class AbstractBankClient implements BankClient{

    protected final String baseUrl;
    protected final String clientId;
    protected final String clientSecret;
    protected final RestTemplate restTemplate;
    protected final String userId;

    private String currentToken;
    private Instant tokenExpiresAt;

    private final ConsentService consentService;
    private String consent;
    private String requestToConsent = null;

    public AbstractBankClient(String baseUrl, String clientId, String clientSecret, String userId, ConsentService consentService) {
        this.baseUrl = baseUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.userId = userId;
        this.restTemplate = new RestTemplate();
        this.consentService = consentService;
        this.restTemplate.setErrorHandler(new DefaultResponseErrorHandler());
    }

    protected String getToken() {
        if (currentToken != null && tokenExpiresAt != null && Instant.now().isBefore(tokenExpiresAt)) {
            return currentToken;
        }

        String tokenUrl = baseUrl + "/auth/bank-token?client_id=" + clientId + "&client_secret=" + clientSecret;

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.set("accept", "application/json");

        try {
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                    tokenUrl, HttpMethod.POST, new HttpEntity<>(httpHeaders), Map.class
            );

            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                currentToken = (String) responseEntity.getBody().get("access_token");
                tokenExpiresAt = Instant.now().plusSeconds(23 * 60 * 60);

                System.out.println("Получен токен для: " + getBankType().toString());
                return  currentToken;
            }
        } catch (Exception e) {
            System.out.println("Ошибка получения токена для банка " + getBankType().toString() + ": " + e.getMessage());
            throw e;
        }

        throw new RuntimeException("Ошибка получения токена для банка " + getBankType());
    }

    protected void createConsent() throws Exception {
        String token = getToken();
        String consentUrl = baseUrl + "/account-consents/request";

        Map<String, Object> requestBody = Map.of(
                "client_id", userId,
                "permissions", List.of("ReadAccountsDetail", "ReadBalances", "ReadTransactionsDetail"),
                "reason", "",
                "requesting_bank", "test_bank",
                "requesting_bank_name", "Test Bank"
        );

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(token);
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
                    System.out.println("Успешно получено согласие для банка " + getBankType().toString() + ": " + consentId);
                    return;
                } else if (status.equals("pending")) {
                    consentService.saveConsent(getBankType(), userId, null, (String) responseEntity.getBody().get("request_id"), "pending");
                    System.out.println("Запрос отправлен на одобрение в банк " + getBankType().toString());
                    //   this.consent = waitForConsentApproval(30);
                    return;
                }
            }
        } catch (Exception e) {
            System.out.println("Ошибка получения согласия для банка " + getBankType().toString() + ": " + e.getMessage());
            throw e;
        }

        throw new RuntimeException("Ошибка получения согласия для банка " + getBankType());
    }

    protected boolean checkConsentStatus() throws Exception {
        String token = getToken();
        String statusUrl = baseUrl + "/account-consents/" + requestToConsent;

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
                    if (data.get("status").equals("Authorized")) {
                        consentService.updateConsentStatus(getBankType(), userId, "Authorized", (String) data.get("consentId"));
                        return true;
                    } else {
                        System.out.println("Согласие не было предоставлено. Пожалуйста, перейдите в ЛК банка " + getBankType().toString() + " и дайте согласие");
                        return false;
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("Ошибка проверки статуса согласия: " + e.getMessage());
        }

        return false;
    }

    /*protected String waitForConsentApproval(int timeoutSeconds) throws Exception {
        System.out.println("Ожидание подтверждения согласия для " + getBankType() + "...");

        long startTime = System.currentTimeMillis();
        long timeoutMs = timeoutSeconds * 1000L;

        while (System.currentTimeMillis() - startTime < timeoutMs) {
            boolean hasConsentId = checkConsentStatus();
            if (hasConsentId) {
                System.out.println("Согласие подтверждено! consentId: " + consent);
            }

            System.out.println("Согласие ещё не подтверждено, ждем...");
            Thread.sleep(5000);
        }

        throw new RuntimeException("Таймаут ожидания подтверждения согласия для " + getBankType());
    }*/

    public List<Account> fetchAccounts() throws Exception {
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

        List<Account> accounts = getAccountList();
        for (Account account: accounts) {
            try {
                List<Balance> balances = getAccountBalances(account.getAccountId());
                List<Transaction> transactions = getAccountTransactions(account.getAccountId());
                updateAccountWithBalances(account, balances);
                account.getTransactions().addAll(transactions);
            } catch (Exception e) {
                System.out.println("Ошибка при сопоставлении аккаунтов и балансов: " + e.getMessage());
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
            System.out.println("Ошибка получения информации из банка " + getBankType().toString() + ": " + e.getMessage());
            throw e;
        }

        return List.of();
    }

    protected List<Balance> getAccountBalances(String accountId) throws Exception {
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
            System.out.println("Ошибка получения информации из банка " + getBankType().toString() + ": " + e.getMessage());
            throw e;
        }
        return List.of();
    }

    protected List<Transaction> getAccountTransactions(String accountId) throws Exception {
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
            System.out.println("Ошибка получения транзакций для счета " + accountId + ": " + e.getMessage());
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
                System.out.println("Ошибка при парсинге даты: " + dateTimeStr);
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
                System.out.println("Ошибка парсинга bookingDateTime: " + bookingDateTimeStr);
            }
        }

        if (valueDateTimeStr != null) {
            try {
                transaction.setValueDateTime(Instant.parse(valueDateTimeStr));
            } catch (Exception e) {
                System.out.println("Ошибка парсинга valueDateTime: " + valueDateTimeStr);
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

}