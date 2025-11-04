package org.vtb.multibanking.entity.quest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.vtb.multibanking.model.quest.QuestStatus;
import org.vtb.multibanking.model.quest.RewardStatus;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_quest")
@CompoundIndex(def = "{'userId': 1, 'questId': 1}", unique = true)
@CompoundIndex(def = "{'userId': 1, 'status': 1}")
public class UserQuestEntity {
    @Id
    private String id;

    @Indexed
    @Field("user_id")
    private String userId;

    @Field("quest_id")
    private String questId;

    @Indexed
    private QuestStatus status;

    @Field("assigned_at")
    private Instant assignedAt;

    @Field("completed_at")
    private Instant completedAt;

    @Field("proof_data")
    private String proofData;

    @Field("reward_code")
    private String rewardCode;

    @Field("reward_status")
    private RewardStatus rewardStatus;

    @Field("partner_activation_id")
    private String partnerActivationId;
}
