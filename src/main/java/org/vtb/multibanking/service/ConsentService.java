package org.vtb.multibanking.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.vtb.multibanking.entity.ConsentEntity;
import org.vtb.multibanking.entity.ProductConsentEntity;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.repository.ConsentRepository;
import org.vtb.multibanking.repository.ProductConsentRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsentService {

    private final ConsentRepository consentRepository;
    private final ProductConsentRepository productConsentRepository;

    public Optional<String> getActiveConsentId(BankType bankType, String clientId) {
        Optional<ConsentEntity> consent = consentRepository.findActiveConsent(bankType, clientId, Instant.now());

        if (consent.isPresent()) {
            log.info("Найдено действующее согласие согласие для {}: {}", bankType, consent.get().getConsentId());
            return Optional.of(consent.get().getConsentId());
        }

        log.info("Действующее согласие для {} не найдено", bankType);
        return Optional.empty();
    }

    public void saveConsent(BankType bankType, String clientId, String consentId, String requestId, String status) {
        Instant expiresAt = Instant.now().plusSeconds(3600 * 24 * 90);

        ConsentEntity consent = consentRepository.findByBankTypeAndClientId(bankType, clientId)
                .map(existing -> {
                    existing.setConsentId(consentId);
                    existing.setRequestId(requestId);
                    existing.setStatus(status);
                    existing.setExpiresAt(expiresAt);
                    existing.setPermissions(List.of("ReadAccountsDetail", "ReadBalances", "ReadTransactionsDetail", "ManageAccounts", "ManageCards", "ReadCards"));
                    return existing;
                })
                .orElse(createNewConsent(bankType, clientId, consentId, requestId, status, expiresAt));

        consentRepository.save(consent);
        log.info("Сохранено согласие для {}: {} - {}", bankType, clientId, status);
    }

    private ConsentEntity createNewConsent(BankType bankType, String clientId,
                                           String consentId, String requestId,
                                           String status, Instant expiresAt) {
        ConsentEntity consent = new ConsentEntity();
        consent.setBankType(bankType);
        consent.setClientId(clientId);
        consent.setConsentId(consentId);
        consent.setRequestId(requestId);
        consent.setStatus(status);
        consent.setExpiresAt(expiresAt);
        consent.setPermissions(List.of("ReadAccountsDetail", "ReadBalances", "ReadTransactionsDetail", "ManageAccounts"));
        return consent;
    }

    public void updateConsentStatus(BankType bankType, String clientId, String status, String consentId) {
        consentRepository.findByBankTypeAndClientId(bankType, clientId)
                .ifPresent(consent -> {
                    consent.setStatus(status);
                    if (consentId != null) {
                        consent.setConsentId(consentId.toLowerCase());
                    }
                    consentRepository.save(consent);
                    log.info("Обновлен статус согласия для {}: {}", bankType, status);
                });
    }

    public Optional<String> getPendingRequestId(BankType bankType, String clientId) {
        return consentRepository.findByBankTypeAndClientId(bankType, clientId)
                .filter(consent -> "pending".equals(consent.getStatus()))
                .map(ConsentEntity::getRequestId);
    }

    public Optional<String> getActiveProductConsentId(BankType bankType, String clientId) {
        Optional<ProductConsentEntity> consent = productConsentRepository.findByBankTypeAndClientId(bankType, clientId);

        if (consent.isPresent()) {
            log.info("Найдено действующее продуктовое согласие для {}: {}", bankType, consent.get().getConsentId());
            return Optional.of(consent.get().getConsentId());
        }

        log.info("Действующее продуктовое согласие для {} не найдено", bankType);
        return Optional.empty();
    }

    public void saveProductConsent(BankType bankType, String clientId, String consentId, String status, BigDecimal maxAmount) {
        Instant expiresAt = Instant.now().plusSeconds(3600 * 24 * 364);

        ProductConsentEntity productConsent = productConsentRepository.findByBankTypeAndClientId(bankType, clientId)
                .map(existing -> {
                    existing.setConsentId(consentId);
                    existing.setStatus(status);
                    existing.setExpiresAt(expiresAt);
                    existing.setMaxAmount(maxAmount);
                    return existing;
                })
                .orElse(createNewProductConsent(bankType, clientId, consentId, status, expiresAt));

        productConsentRepository.save(productConsent);
        log.info("Сохранено продуктовое согласие для {}: {} - {}", bankType, clientId, status);

    }

    private ProductConsentEntity createNewProductConsent(BankType bankType, String clientId,
                                                         String consentId, String status, Instant expiresAt) {
        ProductConsentEntity productConsent = new ProductConsentEntity();
        productConsent.setBankType(bankType);
        productConsent.setClientId(clientId);
        productConsent.setConsentId(consentId);
        productConsent.setStatus(status);
        productConsent.setExpiresAt(expiresAt);

        return productConsent;
    }

    public Optional<ProductConsentEntity> getActiveProductConsent(BankType bankType, String clientId) {
        return productConsentRepository.findActiveConsent(bankType, clientId, Instant.now());
    }

    public boolean checkActiveConsentExpireTime(String consentId) {
        return consentRepository.findByConsentId(consentId).get().isExpired();
    }

    public boolean checkActiveProductConsentExpireTime(String consentId) {
        return productConsentRepository.findByConsentId(consentId).get().isExpired();
    }

}
