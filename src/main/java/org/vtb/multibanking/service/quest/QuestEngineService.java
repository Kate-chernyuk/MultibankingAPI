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
import java.util.Comparator;
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

    public void processTransactionEvent(Transaction transaction, String userId) {
        List<UserQuestEntity> pendingQuests = userQuestRepository.findByUserIdAndStatus(userId, QuestStatus.PENDING);

        for (UserQuestEntity userQuest : pendingQuests) {
            if (userQuest.getStatus() == QuestStatus.COMPLETED) {
                continue;
            }

            QuestEntity quest = questRepository.findById(userQuest.getQuestId()).orElse(null);
            if (quest != null && isTransactionQuestConditionMet(quest, transaction)) {
                log.info("Условие квеста выполнено: questId={}, transactionId={}", quest.getId(), transaction.getTransactionId());

                updateQuestProgress(userQuest, 1);

                if (userQuest.getCurrentProgress() >= userQuest.getTargetProgress()) {
                    log.info("Квест готов к завершению: questId={}, progress={}/{}",
                            quest.getId(), userQuest.getCurrentProgress(), userQuest.getTargetProgress());
                    completeQuest(userQuest, quest, transaction);
                }
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
            if (quest != null && isProductQuestConditionMet(quest, product)) {
                completeQuest(userQuest, quest, product);
            }
        }
    }

    private boolean isTransactionQuestConditionMet(QuestEntity quest, Transaction transaction) {
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

    private boolean isProductQuestConditionMet(QuestEntity quest, Product product) {
        switch (quest.getQuestType()) {
            case PRODUCT_PURCHASE -> {
                String requiredProductType = quest.getConditions().get("product_type");
                if (requiredProductType != null && !"any".equals(requiredProductType)) {
                    return requiredProductType.equalsIgnoreCase(product.getProductType());
                }
                return true;
            }
            case DEPOSIT_AMOUNT -> {
                if ("deposit".equals(product.getProductType()) && quest.getMinAmount() != null) {
                    BigDecimal productAmount = new BigDecimal(product.getMinAmount());
                    return productAmount.compareTo(quest.getMinAmount()) >= 0;
                }
                return false;
            }
        }
        return false;
    }

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

        return activeQuests.stream()
                .filter(quest -> !isQuestCompletedByUser(quest.getId(), userQuests))
                .collect(Collectors.toList());
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
                .currentProgress(0)
                .targetProgress(calculateTargetProgress(questEntity))
                .rewardStatus(RewardStatus.PENDING.toString())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        return userQuestRepository.save(userQuestEntity);
    }

    public Optional<QuestEntity> getCurrentUserQuest(String userId) {
        try {
            List<UserQuestEntity> userQuests = userQuestRepository.findByUserIdAndStatus(userId, QuestStatus.PENDING);

            if (userQuests.isEmpty()) {
                log.info("У пользователь(ницы) {} нет активных квестов, назначаем первый доступный", userId);
                UserQuestEntity newQuest = assignFirstAvailableQuest(userId);
                return questRepository.findById(newQuest.getQuestId());
            }

            UserQuestEntity currentUserQuest = userQuests.stream()
                    .min(Comparator.comparing(UserQuestEntity::getAssignedAt))
                    .orElse(null);

            if (currentUserQuest == null) {
                return Optional.empty();
            }

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

    private void updateQuestProgress(UserQuestEntity userQuest, int progressIncrement) {
        int newProgress = userQuest.getCurrentProgress() + progressIncrement;
        userQuest.setCurrentProgress(newProgress);
        userQuest.setUpdatedAt(Instant.now());
        userQuestRepository.save(userQuest);

        log.debug("Обновлен прогресс квеста {}: {}/{}",
                userQuest.getQuestId(), newProgress, userQuest.getTargetProgress());
    }

    private void completeQuest(UserQuestEntity userQuest, QuestEntity quest, Object proofData) {
        if (userQuest.getStatus() == QuestStatus.COMPLETED) {
            log.warn("Квест {} уже завершен для пользователя {}", quest.getId(), userQuest.getUserId());
            return;
        }

        userQuest.setStatus(QuestStatus.COMPLETED);
        userQuest.setCompletedAt(Instant.now());
        userQuest.setUpdatedAt(Instant.now());

        try {
            String rewardCode = rewardService.generateReward(quest.getRewards());
            userQuest.setRewardStatus(RewardStatus.ACTIVATED.toString());

            userQuestRepository.save(userQuest);
            rewardService.activateUserReward(userQuest.getUserId(), rewardCode);

            log.info("Квест завершен и награда активирована: userId={}, questId={}, rewardCode={}",
                    userQuest.getUserId(), userQuest.getQuestId(), rewardCode);

        } catch (Exception e) {
            log.error("Ошибка при генерации награды для квеста {}: {}", quest.getId(), e.getMessage());
            userQuest.setRewardStatus(RewardStatus.FAILED.toString());
            userQuestRepository.save(userQuest);
        }

        updateQuestCompletionCount(quest.getId());

        updateUserProfile(userQuest.getUserId(), quest);

        log.info("Выполнен квест: userId={}, questId={}, questTitle={}",
                userQuest.getUserId(), userQuest.getQuestId(), quest.getTitle());

        try {
            UserQuestEntity nextQuest = assignFirstAvailableQuest(userQuest.getUserId());
            log.info("Автоматически назначен следующий квест пользователю {}: {}",
                    userQuest.getUserId(), nextQuest.getQuestId());
        } catch (Exception e) {
            log.warn("Не удалось назначить следующий квест пользователю {}: {}",
                    userQuest.getUserId(), e.getMessage());
        }
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
                .set("lastActivity", Instant.now())
                .set("updatedAt", Instant.now());

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
                            .build())
                    .set("updatedAt", Instant.now());

            mongoTemplate.updateFirst(query, update, UserProfileEntity.class);

            log.info("Пользователь {} достиг уровня {}", userId, newLevel);
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

    public UserQuestEntity assignFirstAvailableQuest(String userId) {
        log.info("=== НАЧАЛО assignFirstAvailableQuest для пользователя {} ===", userId);

        List<UserQuestEntity> activeQuests = userQuestRepository.findByUserIdAndStatus(userId, QuestStatus.PENDING);
        if (!activeQuests.isEmpty()) {
            log.info("У пользователя уже есть активные квесты: {}",
                    activeQuests.stream().map(UserQuestEntity::getQuestId).collect(Collectors.toList()));
            return activeQuests.get(0);
        }

        UserProfileEntity userProfile = getUserProfileWithStats(userId);
        SubscriptionTier userTier = userProfile.getSubscriptionTier();

        List<QuestEntity> availableQuests = questRepository.findByRequiredTierAndStatus(userTier, QuestStatus.ACTIVE);

        if (availableQuests.isEmpty()) {
            log.error("Нет доступных квестов для пользователя {} с подпиской {}", userId, userTier);
            throw new RuntimeException("Нет доступных квестов для пользователя");
        }

        List<UserQuestEntity> userCompletedQuests = userQuestRepository.findByUserIdAndStatus(userId, QuestStatus.COMPLETED);
        List<String> completedQuestIds = userCompletedQuests.stream()
                .map(UserQuestEntity::getQuestId)
                .collect(Collectors.toList());

        log.info("Завершенные квесты пользователя: {}", completedQuestIds);
        log.info("Доступные квесты: {}", availableQuests.stream().map(QuestEntity::getId).collect(Collectors.toList()));

        Optional<QuestEntity> firstAvailableQuestOpt = availableQuests.stream()
                .filter(quest -> !completedQuestIds.contains(quest.getId()))
                .min(Comparator.comparing(QuestEntity::getQuestDifficulty));

        if (firstAvailableQuestOpt.isEmpty()) {
            log.error("Все доступные квесты уже завершены пользователем {}", userId);
            throw new RuntimeException("Все доступные квесты уже завершены");
        }

        QuestEntity firstAvailableQuest = firstAvailableQuestOpt.get();
        log.info("Выбран квест для назначения: ID={}, Title={}, Type={}",
                firstAvailableQuest.getId(), firstAvailableQuest.getTitle(), firstAvailableQuest.getQuestType());

        UserQuestEntity userQuest = UserQuestEntity.builder()
                .userId(userId)
                .questId(firstAvailableQuest.getId())
                .status(QuestStatus.PENDING)
                .assignedAt(Instant.now())
                .currentProgress(0)
                .targetProgress(calculateTargetProgress(firstAvailableQuest))
                .rewardStatus(RewardStatus.PENDING.toString())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        UserQuestEntity savedQuest = userQuestRepository.save(userQuest);
        log.info("Квест назначен пользователю: userId={}, questId={}", userId, savedQuest.getQuestId());

        return savedQuest;
    }

    public UserQuestEntity completeCurrentQuestAndAssignNext(String userId, String questId) {
        log.info("Ручное завершение квеста: userId={}, questId={}", userId, questId);

        Optional<UserQuestEntity> userQuestOpt = userQuestRepository.findByUserIdAndQuestId(userId, questId);
        if (userQuestOpt.isEmpty()) {
            throw new RuntimeException("Квест не найден для пользователя");
        }

        UserQuestEntity userQuest = userQuestOpt.get();

        if (userQuest.getStatus() == QuestStatus.COMPLETED) {
            log.warn("Квест уже завершен: userId={}, questId={}", userId, questId);
            return userQuest;
        }

        QuestEntity quest = questRepository.findById(questId)
                .orElseThrow(() -> new RuntimeException("Квест не найден"));

        if (userQuest.getCurrentProgress() < userQuest.getTargetProgress()) {
            log.warn("Квест еще не выполнен: текущий прогресс {}/{}",
                    userQuest.getCurrentProgress(), userQuest.getTargetProgress());
            throw new RuntimeException("Квест еще не выполнен");
        }

        userQuest.setStatus(QuestStatus.COMPLETED);
        userQuest.setCompletedAt(Instant.now());
        userQuest.setUpdatedAt(Instant.now());
        userQuestRepository.save(userQuest);

        awardQuestRewards(userId, quest);

        log.info("Квест успешно завершен: userId={}, questId={}", userId, questId);

        try {
            UserQuestEntity nextQuest = assignFirstAvailableQuest(userId);
            log.info("Следующий квест назначен: {}", nextQuest.getQuestId());
            return nextQuest;
        } catch (Exception e) {
            log.error("Ошибка при назначении следующего квеста: {}", e.getMessage());
            throw new RuntimeException("Квест завершен, но не удалось назначить следующий: " + e.getMessage());
        }
    }


    public void updateQuestProgress(String userId, String questType, int progressIncrement) {
        List<UserQuestEntity> activeQuests = userQuestRepository.findByUserIdAndStatus(userId, QuestStatus.PENDING);

        for (UserQuestEntity userQuest : activeQuests) {
            QuestEntity quest = questRepository.findById(userQuest.getQuestId()).orElse(null);
            if (quest != null && quest.getQuestType().name().equals(questType)) {
                updateQuestProgress(userQuest, progressIncrement);

                if (userQuest.getCurrentProgress() >= userQuest.getTargetProgress()) {
                    completeCurrentQuestAndAssignNext(userId, quest.getId());
                }
                break;
            }
        }
    }

    private int calculateTargetProgress(QuestEntity quest) {
        if (quest.getMinOperations() != null) {
            return quest.getMinOperations();
        }
        if (quest.getMinAmount() != null) {
            return 1;
        }
        return 1;
    }

    private void awardQuestRewards(String userId, QuestEntity quest) {
        UserProfileEntity profile = getUserProfileWithStats(userId);

        profile.setActivityPoints(profile.getActivityPoints() + quest.getPoints());
        profile.setQuestsCompleted(profile.getQuestsCompleted() + 1);
        profile.setUpdatedAt(Instant.now());

        userProfileRepository.save(profile);
        log.info("Пользователю {} начислено {} очков за квест {}", userId, quest.getPoints(), quest.getTitle());
    }
}