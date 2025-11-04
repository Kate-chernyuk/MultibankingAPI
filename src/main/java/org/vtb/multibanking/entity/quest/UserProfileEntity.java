package org.vtb.multibanking.entity.quest;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.vtb.multibanking.model.quest.ActiveReward;
import org.vtb.multibanking.model.quest.LevelHistory;
import org.vtb.multibanking.model.quest.SubscriptionTier;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_profile")
public class UserProfileEntity {
    @Id
    private String id;

    @Indexed(unique = true)
    @Field("user_id")
    private String userId;

    @Field("subscription_tier")
    private SubscriptionTier subscriptionTier;

    @Field("activity_points")
    private Integer activityPoints;

    @Field("current_level")
    private Integer currentLevel;

    @Field("quests_completed")
    private Integer questsCompleted;

    @Field("premium_expiry")
    private Instant premiumExpiry;

    @Field("last_activity")
    private Instant lastActivity;

    @Field("free_quests_used")
    private Integer freeQuestsUsed;

    @Field("premium_quests_used")
    private Integer premiumQuestsUsed;

    @Field("active_rewards")
    @Builder.Default
    private List<ActiveReward> activeRewards = new ArrayList<>();

    @Field("level_history")
    @Builder.Default
    private List<LevelHistory> levelHistory = new ArrayList<>();

    @Field("created_at")
    private Instant createdAt;

    @Field("updated_at")
    private Instant updatedAt;

    public List<ActiveReward> getActiveRewards() {
        return activeRewards;
    }

    public void setActiveRewards(List<ActiveReward> activeRewards) {
        this.activeRewards = activeRewards;
    }
}
