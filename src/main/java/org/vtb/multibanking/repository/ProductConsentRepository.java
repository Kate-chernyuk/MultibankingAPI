package org.vtb.multibanking.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import org.vtb.multibanking.entity.ProductConsentEntity;
import org.vtb.multibanking.model.BankType;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductConsentRepository extends MongoRepository<ProductConsentEntity, String> {

    Optional<ProductConsentEntity> findByBankTypeAndClientId(BankType bankType, String clientId);

    @Query("{ 'bankType': ?0, 'clientId': ?1, 'status': { $in: ['approved', 'authorized'] }, 'expiresAt': { $gt: ?2 } }")
    Optional<ProductConsentEntity> findActiveConsent(BankType bankType, String clientId, Instant now);

    @Query("{ 'status': 'pending', 'updatedAt': { $lt: ?0 } }")
    List<ProductConsentEntity> findStalePendingConsents(Instant threshold);

    @Query("{ 'expiresAt': { $lt: ?0 }, 'status': { $ne: 'expired' } }")
    List<ProductConsentEntity> findExpiredConsents(Instant now);

    @Query("{ 'clientId': ?0, 'status': { $in: ['approved', 'authorized'] }, 'expiresAt': { $gt: ?1 } }")
    List<ProductConsentEntity> findAllActiveConsentsByClientId(String clientId, Instant now);
}