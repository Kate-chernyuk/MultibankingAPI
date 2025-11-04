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
import org.vtb.multibanking.model.quest.QuestDifficulty;
import org.vtb.multibanking.model.quest.QuestStatus;
import org.vtb.multibanking.model.quest.QuestType;
import org.vtb.multibanking.model.quest.SubscriptionTier;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "quest")
@CompoundIndex(def = "{'type': 1, 'status': 1, 'startDate': 1, 'endDate': 1}")
public class QuestEntity {
    @Id
    private String id;

    @Indexed
    private String title;
    private String description;

    @Field("quest_type")
    private QuestType questType;

    @Field("difficulty")
    private QuestDifficulty questDifficulty;

    private Map<String, String> conditions;
    private Map<String, String> rewards;

    private Integer points;

    @Field("max_completions")
    private Integer maxCompletions;

    @Field("current_completions")
    private Integer currentCompletions;

    @Indexed
    private QuestStatus status;

    @Field("start_date")
    private Instant startDate;

    @Field("end_date")
    private Instant endDate;

    @Field("partner_id")
    private String partnerId;

    @Field("min_amount")
    private BigDecimal minAmount;

    @Field("min_operations")
    private Integer minOperations;

    @Field("required_tier")
    private SubscriptionTier requiredTier;

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;
}

