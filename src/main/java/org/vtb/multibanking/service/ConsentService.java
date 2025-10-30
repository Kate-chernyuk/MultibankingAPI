package org.vtb.multibanking.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.vtb.multibanking.entity.ConsentEntity;
import org.vtb.multibanking.model.BankType;
import org.vtb.multibanking.repository.ConsentRepository;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConsentService {

    private final ConsentRepository consentRepository;

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
        consent.setPermissions(List.of("ReadAccountsDetail", "ReadBalances", "ReadTransactionsDetail"));
        return consent;
    }

    public void updateConsentStatus(BankType bankType, String clientId, String status, String consentId) {
        consentRepository.findByBankTypeAndClientId(bankType, clientId)
                .ifPresent(consent -> {
                    consent.setStatus(status);
                    if (consentId != null) {
                        consent.setConsentId(consentId);
                    }
                    consentRepository.save(consent);
                    log.info("Обновлен статус согласия для {}: {}", bankType, status);
                });
    }

    public Optional<String> getPendingRequestId(BankType bankType, String clientId) {
        return consentRepository.findByBankTypeAndClientId(bankType, clientId)
                .filter(consent -> "PENDING".equals(consent.getStatus()))
                .map(ConsentEntity::getRequestId);
    }


}
