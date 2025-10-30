package org.vtb.multibanking.service.bank;

import org.springframework.http.*;
import org.springframework.web.client.DefaultResponseErrorHandler;
import org.springframework.web.client.RestTemplate;
import org.vtb.multibanking.model.Account;
import org.vtb.multibanking.model.AccountIdentification;
import org.vtb.multibanking.model.Amount;
import org.vtb.multibanking.model.Balance;
import org.vtb.multibanking.repository.ConsentRepository;
import org.vtb.multibanking.service.ConsentService;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public abstract class AbstractBankClient implements BankClient{

    protected final String baseUrl;
    protected final String clientId;
    protected final String clientSecret;
    protected final RestTemplate restTemplate;

    private String currentToken;
    private Instant tokenExpiresAt;

    private ConsentService consentService;
    private String consent;
    private String requestToConsent;

    public AbstractBankClient(String baseUrl, String clientId, String clientSecret, ConsentService consentService) {
        this.baseUrl = baseUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.restTemplate = new RestTemplate();
        this.consentService = consentService;
        this.restTemplate.setErrorHandler(new DefaultResponseErrorHandler());
    }

    protected String getToken() throws Exception {
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
                "client_id", clientId + "-2",
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
                    consentService.saveConsent(getBankType(), clientId+"-2", consentId, null, "approved");
                    System.out.println("Успешно получено согласие для банка " + getBankType().toString() + ": " + consentId);
                    return;
                } else if (status.equals("pending")) {
                    consentService.saveConsent(getBankType(), clientId+"-2", null, (String) responseEntity.getBody().get("request_id"), "pending");
                    System.out.println("Запрос отправлен на одобрение в банк " + getBankType().toString());
                 //   this.consent = waitForConsentApproval(30);
                    return;
                    // TODO: реализовать получеие обратной связи от банка, что дескать, согласие подтверждено
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
                        consentService.updateConsentStatus(getBankType(), clientId+"-2", "Authorized", (String) data.get("consentId"));
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
        Optional<String> activeConsent = consentService.getActiveConsentId(getBankType(), clientId+"-2");
        if (activeConsent.isEmpty()) {
           createConsent();
        }

        if (activeConsent.isEmpty()) {
            createConsent();

            activeConsent = consentService.getActiveConsentId(getBankType(), clientId+"-2");

            if (activeConsent.isEmpty()) {
                throw new Exception("Не удалось получить действующее согласие для банка " + getBankType());
            }
        }

        this.consent = activeConsent.get();

        List<Account> accounts = getAccountList();
        for (Account account: accounts) {
            try {
                List<Balance> balances = getAccountBalances(account.getAccountId());
                updateAccountWithBalances(account, balances);
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

        String token = getToken();
        String accountUrl = baseUrl + "/accounts?client_id=" + clientId + "-2";

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(token);
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
        String token = getToken();
        String balancesUrl = baseUrl + "/accounts/" + accountId + "/balances";

        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.setBearerAuth(token);
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
