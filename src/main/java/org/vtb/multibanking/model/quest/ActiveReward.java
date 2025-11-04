package org.vtb.multibanking.model.quest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActiveReward {
    @Field("reward_id")
    private String rewardId;

    @Field("reward_type")
    private String rewardType;

    @Field("reward_code")
    private String rewardCode;

    @Field("partner_id")
    private String partnerId;

    @Field("expiry_date")
    private Instant expiryDate;

    private Boolean used;

    @Field("quest_id")
    private String questId;
}
