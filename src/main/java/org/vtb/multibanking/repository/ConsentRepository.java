package org.vtb.multibanking.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import org.vtb.multibanking.entity.ConsentEntity;
import org.vtb.multibanking.model.BankType;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface ConsentRepository extends MongoRepository<ConsentEntity, String> {
    Optional<ConsentEntity> findByBankTypeAndClientId(BankType bankType, String clientId);

    @Query("{ 'bankType': ?0, 'clientId': ?1, 'status': { $in: ['approved', 'authorized'] }, 'expiresAt': { $gt: ?2 } }")
    Optional<ConsentEntity> findActiveConsent(BankType bankType, String clientId, Instant now);

    @Query("{ 'consentId': ?0 }")
    Optional<ConsentEntity> findByConsentId(String consentId);
}
