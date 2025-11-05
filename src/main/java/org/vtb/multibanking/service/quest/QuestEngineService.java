package org.vtb.multibanking.service.quest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.vtb.multibanking.model.quest.LevelHistory;
import org.vtb.multibanking.entity.quest.QuestEntity;
import org.vtb.multibanking.entity.quest.UserProfileEntity;
import org.vtb.multibanking.entity.quest.UserQuestEntity;
import org.vtb.multibanking.model.Account;
import org.vtb.multibanking.model.Product;
import org.vtb.multibanking.model.Transaction;
import org.vtb.multibanking.model.quest.QuestStatus;
import org.vtb.multibanking.model.quest.QuestType;
import org.vtb.multibanking.model.quest.RewardStatus;
import org.vtb.multibanking.model.quest.SubscriptionTier;
import org.vtb.multibanking.repository.QuestRepository;
import org.vtb.multibanking.repository.UserProfileRepository;
import org.vtb.multibanking.repository.UserQuestRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestEngineService {

    private final QuestRepository questRepository;
    private final UserQuestRepository userQuestRepository;
    private final UserProfileRepository userProfileRepository;
    private final RewardService rewardService;
    private final MongoTemplate mongoTemplate;

    public List<QuestEntity> getAvailableQuests(String userId) {
        UserProfileEntity profile = getUserProfile(userId);
        Instant now = Instant.now();

        List<QuestEntity> activeQuests = questRepository.findAvailableQuests(
                profile.getSubscriptionTier(),
                QuestStatus.ACTIVE,
                now,
                now
        );

        List<UserQuestEntity> userQuests = userQuestRepository.findByUserId(userId);

        List<QuestEntity> availableQuests = activeQuests.stream()
                .filter(quest -> !isQuestCompletedByUser(quest.getId(), userQuests))
                .collect(Collectors.toList());

        return availableQuests;
    }

    private boolean isQuestCompletedByUser(String questId, List<UserQuestEntity> userQuests) {
        return userQuests.stream()
                .anyMatch(userQuest ->
                        userQuest.getQuestId().equals(questId) &&
                                userQuest.getStatus() == QuestStatus.COMPLETED
                );
    }

    public UserQuestEntity assignQuest(String userId, String questId) throws Exception {
            QuestEntity questEntity = questRepository.findById(questId)
                    .orElseThrow(() -> new Exception("Квест " + questId + "не найден"));

            UserProfileEntity userProfileEntity = getUserProfile(userId);

        Optional<UserQuestEntity> existingCompletedQuest = userQuestRepository.findByUserIdAndQuestId(userId, questId);
        if (existingCompletedQuest.isPresent() &&
                existingCompletedQuest.get().getStatus() == QuestStatus.COMPLETED) {
            throw new Exception("Пользователь(ница) уже завершил(а) этот квест");
        }

            if (questEntity.getRequiredTier() == SubscriptionTier.PREMIUM &&
            userProfileEntity.getSubscriptionTier() != SubscriptionTier.PREMIUM) {
                throw new Exception("Для этого квеста необходима премиум-подписка");
            }

            if (questEntity.getMaxCompletions() != null &&
            questEntity.getCurrentCompletions() >= questEntity.getMaxCompletions()) {
                throw new Exception("Достигнут лимит доступных квестов");
            }

            Optional<UserQuestEntity> existingQuest = userQuestRepository.findByUserIdAndQuestId(userId, questId);
            if (existingQuest.isPresent()) {
                throw new Exception("Пользователь(ница) в данный момент уже проходит квест");
            }

            UserQuestEntity userQuestEntity = UserQuestEntity.builder()
                    .userId(userId)
                    .questId(questId)
                    .status(QuestStatus.PENDING)
                    .assignedAt(Instant.now())
                    .rewardStatus(RewardStatus.PENDING)
                    .build();

            return userQuestRepository.save(userQuestEntity);
    }

    public Optional<QuestEntity> getCurrentUserQuest(String userId) {
        try {
            List<UserQuestEntity> userQuests = userQuestRepository.findByUserIdAndStatus(userId, QuestStatus.PENDING);

            if (userQuests.isEmpty()) {
                log.info("У пользователь(ницы) {} нет активных квестов", userId);
                return Optional.empty();
            }

            UserQuestEntity currentUserQuest = userQuests.get(0);
            String questId = currentUserQuest.getQuestId();

            Optional<QuestEntity> quest = questRepository.findById(questId);
            if (quest.isEmpty()) {
                log.warn("Квест {} не найден в репозитории для пользователь(ницы) {}", questId, userId);
                return Optional.empty();
            }

            log.info("Найден текущий квест для пользователь(ницы) {}: {}", userId, quest.get().getTitle());
            return quest;

        } catch (Exception e) {
            log.error("Ошибка при получении текущего квеста для пользователь(ницы) {}: {}", userId, e.getMessage());
            return Optional.empty();
        }
    }

    public void processTransactionEvent(Transaction transaction, String userId) {
        List<UserQuestEntity> pendingQuests = userQuestRepository.findByUserIdAndStatus(userId, QuestStatus.PENDING);

        for (UserQuestEntity userQuest : pendingQuests) {
            QuestEntity quest = questRepository.findById(userQuest.getQuestId()).orElse(null);
            if (quest != null && isQuestConditionMet(quest, transaction)) {
                completeQuest(userQuest, quest, transaction);
            }
        }
    }

    public void processAccountEvent(Account account, String userId) {
        List<UserQuestEntity> pendingQuests = userQuestRepository.findByUserIdAndStatus(userId, QuestStatus.PENDING);

        for (UserQuestEntity userQuest : pendingQuests) {
            QuestEntity quest = questRepository.findById(userQuest.getQuestId()).orElse(null);
            if (quest != null && quest.getQuestType() == QuestType.ACCOUNT_OPENING) {
                completeQuest(userQuest, quest, account);
            }
        }
    }

    public void processProductEvent(Product product, String userId) {
        List<UserQuestEntity> pendingQuests = userQuestRepository.findByUserIdAndStatus(userId, QuestStatus.PENDING);

        for (UserQuestEntity userQuest : pendingQuests) {
            QuestEntity quest = questRepository.findById(userQuest.getQuestId()).orElse(null);
            if (quest != null && quest.getQuestType() == QuestType.PRODUCT_PURCHASE) {
                completeQuest(userQuest, quest, product);
            }
        }
    }

    private boolean isQuestConditionMet(QuestEntity quest, Transaction transaction) {
        switch (quest.getQuestType()) {
            case TRANSFER_AMOUNT -> {
                if (quest.getMinAmount() != null) {
                    BigDecimal txAmount = new BigDecimal(transaction.getAmount().getAmount());
                    return txAmount.compareTo(quest.getMinAmount()) >= 0;
                }
            }
            case PAYMENT_OPERATION -> {
                return transaction.getTransactionInformation() != null &&
                        transaction.getTransactionInformation().toLowerCase().contains("payment");
            }
        }
        return false;
    }

    private void completeQuest(UserQuestEntity userQuest, QuestEntity quest, Object proofData) {
        userQuest.setStatus(QuestStatus.COMPLETED);
        userQuest.setCompletedAt(Instant.now());
        userQuest.setProofData(proofData != null ? proofData.toString() : null);

        String rewardCode = rewardService.generateReward(quest.getRewards());
        userQuest.setRewardCode(rewardCode);
        userQuest.setRewardStatus(RewardStatus.ACTIVATED);

        userQuestRepository.save(userQuest);

        rewardService.activateUserReward(userQuest.getUserId(), rewardCode);

        updateQuestCompletionCount(quest.getId());

        updateUserProfile(userQuest.getUserId(), quest);

        log.info("Выполнен квест: userId={}, questId={}", userQuest.getUserId(), userQuest.getQuestId());
    }

    private void updateQuestCompletionCount(String questId) {
        Query query = new Query(Criteria.where("id").is(questId));
        Update update = new Update().inc("currentCompletions", 1);
        mongoTemplate.updateFirst(query, update, QuestEntity.class);
    }

    private void updateUserProfile(String userId, QuestEntity quest) {
        Query query = new Query(Criteria.where("userId").is(userId));
        Update update = new Update()
                .inc("activityPoints", quest.getPoints())
                .inc("questsCompleted", 1)
                .set("lastActivity", Instant.now());

        mongoTemplate.updateFirst(query, update, UserProfileEntity.class);

        updateUserLevel(userId);
    }

    private void updateUserLevel(String userId) {
        UserProfileEntity profile = getUserProfile(userId);
        Integer newLevel = calculateLevel(profile.getActivityPoints());

        if (!newLevel.equals(profile.getCurrentLevel())) {
            Query query = new Query(Criteria.where("userId").is(userId));
            Update update = new Update()
                    .set("currentLevel", newLevel)
                    .push("levelHistory", LevelHistory.builder()
                            .level(newLevel)
                            .achievedAt(Instant.now())
                            .pointsRequired(profile.getActivityPoints())
                            .build());

            mongoTemplate.updateFirst(query, update, UserProfileEntity.class);
        }
    }

    private Integer calculateLevel(Integer points) {
        if (points >= 100) return 3; // Gold
        if (points >= 50) return 2;  // Silver
        return 1; // Bronze
    }

    private UserProfileEntity getUserProfile(String userId) {
        return userProfileRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultProfile(userId));
    }

    private UserProfileEntity createDefaultProfile(String userId) {
        UserProfileEntity userProfileEntity = UserProfileEntity.builder()
                .userId(userId)
                .subscriptionTier(SubscriptionTier.FREE)
                .activityPoints(0)
                .currentLevel(1)
                .questsCompleted(0)
                .freeQuestsUsed(0)
                .premiumQuestsUsed(0)
                .lastActivity(Instant.now())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return userProfileRepository.save(userProfileEntity);
    }

    public UserProfileEntity getUserProfileWithStats(String userId) {
        return getUserProfile(userId);
    }
}
