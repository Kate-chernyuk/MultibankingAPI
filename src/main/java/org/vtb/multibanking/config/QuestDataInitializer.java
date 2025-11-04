package org.vtb.multibanking.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.vtb.multibanking.entity.quest.QuestEntity;
import org.vtb.multibanking.model.quest.QuestDifficulty;
import org.vtb.multibanking.model.quest.QuestStatus;
import org.vtb.multibanking.model.quest.QuestType;
import org.vtb.multibanking.model.quest.SubscriptionTier;
import org.vtb.multibanking.repository.QuestRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class QuestDataInitializer implements CommandLineRunner {

    private final QuestRepository questRepository;

    @Override
    public void run(String... args) throws Exception {
        if (questRepository.count() == 0) {
            initializeSampleQuests();
        }
    }

    private void initializeSampleQuests() {
        // Базовые квесты для FREE tier
        QuestEntity openAccountQuest = QuestEntity.builder()
                .title("Откройте новый счёт")
                .description("Откройте счёт в любом банке и получите скидку 15% у партнёра")
                .questType(QuestType.ACCOUNT_OPENING)
                .questDifficulty(QuestDifficulty.BASIC)
                .conditions(Map.of("action", "account_opening", "bank_type", "any"))
                .rewards(Map.of(
                        "questType", "partner_discount",
                        "value", "15",
                        "partnerId", "partner_retail",
                        "category", "shopping"
                ))
                .points(5)
                .maxCompletions(1000)
                .currentCompletions(0)
                .status(QuestStatus.ACTIVE)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(3600 * 24 * 31))
                .requiredTier(SubscriptionTier.FREE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        questRepository.save(openAccountQuest);

        QuestEntity firstProductQuest = QuestEntity.builder()
                .title("Первый финансовый продукт")
                .description("Приобретите любой финансовый продукт (вклад, кредит или карту) и получите бонусные баллы")
                .questType(QuestType.PRODUCT_PURCHASE)
                .questDifficulty(QuestDifficulty.BASIC)
                .conditions(Map.of(
                        "action", "product_purchase",
                        "product_type", "any",
                        "min_amount", "1000"
                ))
                .rewards(Map.of(
                        "questType", "cashback",
                        "value", "5",
                        "category", "all",
                        "duration", "30days",
                        "bonus_points", "100"
                ))
                .points(8)
                .minAmount(new BigDecimal("1000"))
                .maxCompletions(800)
                .currentCompletions(0)
                .status(QuestStatus.ACTIVE)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(3600 * 24 * 31))
                .requiredTier(SubscriptionTier.FREE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        questRepository.save(firstProductQuest);

        // Продвинутые квесты
        QuestEntity largeTransferQuest = QuestEntity.builder()
                .title("Крупный перевод")
                .description("Сделайте перевод на сумму более 10,000 ₽")
                .questType(QuestType.TRANSFER_AMOUNT)
                .questDifficulty(QuestDifficulty.ADVANCED)
                .conditions(Map.of("min_amount", "10000", "operation_type", "transfer"))
                .rewards(Map.of(
                        "questType", "cashback",
                        "value", "3",
                        "category", "restaurants",
                        "duration", "30days"
                ))
                .points(10)
                .minAmount(new BigDecimal("10000"))
                .maxCompletions(500)
                .currentCompletions(0)
                .status(QuestStatus.ACTIVE)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(3600 * 24 * 31))
                .requiredTier(SubscriptionTier.FREE)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        questRepository.save(largeTransferQuest);

        // PREMIUM эксклюзивные квесты
        QuestEntity premiumDepositQuest = QuestEntity.builder()
                .title("Премиум вклад")
                .description("Пополните вклад на 50,000 ₽ и получите повышенный кэшбэк")
                .questType(QuestType.DEPOSIT_AMOUNT)
                .questDifficulty(QuestDifficulty.EXCLUSIVE)
                .conditions(Map.of("min_amount", "50000", "product_type", "deposit"))
                .rewards(Map.of(
                        "questType", "premium_cashback",
                        "value", "5",
                        "category", "all",
                        "bonus", "free_month"
                ))
                .points(15)
                .minAmount(new BigDecimal("50000"))
                .maxCompletions(200)
                .currentCompletions(0)
                .status(QuestStatus.ACTIVE)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(3600 * 24 * 31))
                .requiredTier(SubscriptionTier.PREMIUM)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        questRepository.save(premiumDepositQuest);

        log.info("Инициализированы {} базовые квесты", questRepository.count());
    }
}
