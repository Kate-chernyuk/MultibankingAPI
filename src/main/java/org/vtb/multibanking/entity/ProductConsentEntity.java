package org.vtb.multibanking.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.vtb.multibanking.model.BankType;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Document(collection = "product_consents")
@CompoundIndex(def = "{'bankType': 1, 'clientId': 1}", unique = true)
public class ProductConsentEntity {

    @Id
    private String id;

    @Indexed
    @Field("bank_type")
    private BankType bankType;

    @Indexed
    @Field("client_id")
    private String clientId;

    @Field("consent_id")
    private String consentId;

    @Field("status")
    private String status;

    @Field("expires_at")
    private Instant expiresAt;

    @Field("max_amount")
    private BigDecimal maxAmount;

    @Field("created_at")
    private Instant createdAt = Instant.now();

    public boolean isActive() {
        return "approved".equals(status) &&
                expiresAt != null &&
                Instant.now().isBefore(expiresAt);
    }

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }
}