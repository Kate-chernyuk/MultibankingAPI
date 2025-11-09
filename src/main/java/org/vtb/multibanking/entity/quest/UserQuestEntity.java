package org.vtb.multibanking.entity.quest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.vtb.multibanking.model.quest.QuestStatus;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_quests")
@CompoundIndex(def = "{'userId': 1, 'questId': 1}", unique = true)
public class UserQuestEntity {
    @Id
    private String id;

    @Field("user_id")
    private String userId;

    @Field("quest_id")
    private String questId;

    private QuestStatus status;

    @Field("assigned_at")
    private Instant assignedAt;

    @Field("completed_at")
    private Instant completedAt;

    @Field("current_progress")
    private Integer currentProgress;

    @Field("target_progress")
    private Integer targetProgress;

    @Field("reward_status")
    private String rewardStatus;

    @Field("partner_activation_id")
    private String partnerActivationId;

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;
}