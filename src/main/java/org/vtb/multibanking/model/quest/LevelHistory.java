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
public class LevelHistory {
    @Field("level")
    private Integer level;

    @Field("achieved_at")
    private Instant achievedAt;

    @Field("points_required")
    private Integer pointsRequired;
}
