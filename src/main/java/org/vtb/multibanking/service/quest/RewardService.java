package org.vtb.multibanking.service.quest;

import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.vtb.multibanking.model.quest.ActiveReward;
import org.vtb.multibanking.entity.quest.UserProfileEntity;
import org.vtb.multibanking.repository.UserProfileRepository;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RewardService {
    private final UserProfileRepository userProfileRepository;
    private final MongoTemplate mongoTemplate;

    public String generateReward(Map<String, String> rewardConfig) {
        return "RWD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public void activateUserReward(String userId, String rewardCode) {
        UserProfileEntity profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Нет такого юзера"));

        ActiveReward activeReward = ActiveReward.builder()
                .rewardId(UUID.randomUUID().toString())
                .rewardType("partner_discount")
                .rewardCode(rewardCode)
                .expiryDate(Instant.now().plusSeconds(3600 * 24 * 30))
                .used(false)
                .build();

        Query query = new Query(Criteria.where("userId").is(userId));
        Update update = new Update().push("activeRewards", activeReward);
        mongoTemplate.updateFirst(query, update, UserProfileEntity.class);
    }
}
