package org.vtb.multibanking.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.vtb.multibanking.model.BankType;

import java.time.Instant;
import java.util.List;

@Data
@Document(collection = "consents")
@CompoundIndex(def = "{'bankType': 1, 'clientId': 1}", unique = true)
public class ConsentEntity {

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

    @Field("request_id")
    private String requestId;

    @Indexed
    private String status;

    private List<String> permissions;

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;

    @Field("expires_at")
    private Instant expiresAt;

    public boolean isActive() {
        return ("APPROVED".equals(status) || "AUTHORIZED".equals(status))
                && Instant.now().isBefore(expiresAt);
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }
}
