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
        // Free квесты
        QuestEntity transfersQuest = QuestEntity.builder()
                .title("Надо бы перевести...")
                .description("Совершите перевод между счетами в 10000 ₽ минимум и получите кэшбэк 3% на рестораны")
                .questType(QuestType.TRANSFER_AMOUNT)
                .questDifficulty(QuestDifficulty.BASIC)
                .conditions(Map.of("min_amount", "10000", "operation_type", "transfer"))
                .rewards(Map.of(
                        "questType", "cashback",
                        "value", "3",
                        "category", "restaurants",
                        "duration", "30days",
                        "prizeName", "Кэшбэк 3% на рестораны"
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

        questRepository.save(transfersQuest);

        QuestEntity firstProductQuest = QuestEntity.builder()
                .title("Первый финансовый продукт")
                .description("Приобретите любой финансовый продукт (вклад или кредит) за 1000 ₽ минимум и получите бонусные баллы")
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
                        "bonus_points", "100",
                        "prizeName", "Кэшбэк 30% на всё"
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
                        "category", "shopping",
                        "prizeName", "Скидка 15% в 'Рога и Копыта'"
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

        // PREMIUM квесты
        QuestEntity vbankAccountQuest = QuestEntity.builder()
                .title("Откройте счёт в VBank")
                .description("Откройте счёт в VBank и получите специальные условия")
                .questType(QuestType.ACCOUNT_OPENING)
                .questDifficulty(QuestDifficulty.EXCLUSIVE)
                .conditions(Map.of("action", "account_opening", "bank_type", "VBANK"))
                .rewards(Map.of(
                        "questType", "premium_bonus",
                        "value", "15",
                        "partnerId", "vbank_partner",
                        "category", "premium",
                        "prizeName", "Специальные условия от VBank"
                ))
                .points(10)
                .maxCompletions(300)
                .currentCompletions(0)
                .status(QuestStatus.ACTIVE)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(3600 * 24 * 31))
                .requiredTier(SubscriptionTier.PREMIUM)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        questRepository.save(vbankAccountQuest);

        QuestEntity depositQuest = QuestEntity.builder()
                .title("Приобретите вклад")
                .description("Откройте любой вклад и получите бонусные баллы")
                .questType(QuestType.DEPOSIT_AMOUNT)
                .questDifficulty(QuestDifficulty.ADVANCED)
                .conditions(Map.of("action", "deposit_opening", "product_type", "deposit"))
                .rewards(Map.of(
                        "questType", "bonus_points",
                        "value", "1000",
                        "category", "savings",
                        "prizeName", "Бонусные баллы"
                ))
                .points(10)
                .maxCompletions(400)
                .currentCompletions(0)
                .status(QuestStatus.ACTIVE)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(3600 * 24 * 31))
                .requiredTier(SubscriptionTier.PREMIUM)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        questRepository.save(depositQuest);

        QuestEntity largeTransferQuest = QuestEntity.builder()
                .title("Крупный перевод")
                .description("Сделайте перевод на сумму более 10,000 ₽")
                .questType(QuestType.TRANSFER_AMOUNT)
                .questDifficulty(QuestDifficulty.ADVANCED)
                .conditions(Map.of("min_amount", "10000", "operation_type", "transfer"))
                .rewards(Map.of(
                        "questType", "cashback",
                        "value", "5",
                        "category", "all",
                        "duration", "30days",
                        "prizeName", "Кэшбэк 5% на все покупки"
                ))
                .points(10)
                .minAmount(new BigDecimal("10000"))
                .maxCompletions(500)
                .currentCompletions(0)
                .status(QuestStatus.ACTIVE)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(3600 * 24 * 31))
                .requiredTier(SubscriptionTier.PREMIUM)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        questRepository.save(largeTransferQuest);

        QuestEntity premiumDepositQuest = QuestEntity.builder()
                .title("Премиум вклад")
                .description("Пополните вклад на сумму ≥ 50,000 ₽ и получите бесплатный месяц обслуживания")
                .questType(QuestType.DEPOSIT_AMOUNT)
                .questDifficulty(QuestDifficulty.EXCLUSIVE)
                .conditions(Map.of("min_amount", "50000", "product_type", "deposit"))
                .rewards(Map.of(
                        "questType", "premium_service",
                        "value", "1",
                        "service", "card_maintenance",
                        "duration", "1month",
                        "prizeName", "Бесплатный месяц обслуживания карты"
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

        QuestEntity loanQuest = QuestEntity.builder()
                .title("Приобретите кредит")
                .description("Оформите любой кредитный продукт и получите бонусные баллы")
                .questType(QuestType.PRODUCT_PURCHASE)
                .questDifficulty(QuestDifficulty.ADVANCED)
                .conditions(Map.of("action", "loan_opening", "product_type", "loan"))
                .rewards(Map.of(
                        "questType", "bonus_points",
                        "value", "1000",
                        "category", "credit",
                        "prizeName", "Бонусные баллы"
                ))
                .points(10)
                .maxCompletions(300)
                .currentCompletions(0)
                .status(QuestStatus.ACTIVE)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(3600 * 24 * 31))
                .requiredTier(SubscriptionTier.PREMIUM)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        questRepository.save(loanQuest);

        QuestEntity cardQuest = QuestEntity.builder()
                .title("Приобретите карту")
                .description("Оформите любую карту и получите бонусные баллы")
                .questType(QuestType.PRODUCT_PURCHASE)
                .questDifficulty(QuestDifficulty.ADVANCED)
                .conditions(Map.of("action", "card_opening", "product_type", "card"))
                .rewards(Map.of(
                        "questType", "bonus_points",
                        "value", "1000",
                        "category", "cards",
                        "prizeName", "Бонусные баллы"
                ))
                .points(10)
                .maxCompletions(500)
                .currentCompletions(0)
                .status(QuestStatus.ACTIVE)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(3600 * 24 * 31))
                .requiredTier(SubscriptionTier.PREMIUM)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        questRepository.save(cardQuest);

        QuestEntity referralQuest = QuestEntity.builder()
                .title("Пригласите друга")
                .description("Пригласите друга в систему и получите 1000 бонусных баллов")
                .questType(QuestType.REFERRAL)
                .questDifficulty(QuestDifficulty.EXCLUSIVE)
                .conditions(Map.of("action", "referral", "min_referrals", "1"))
                .rewards(Map.of(
                        "questType", "bonus_points",
                        "value", "1000",
                        "category", "referral",
                        "prizeName", "1000 бонусных баллов"
                ))
                .points(15)
                .maxCompletions(100)
                .currentCompletions(0)
                .status(QuestStatus.ACTIVE)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(3600 * 24 * 31))
                .requiredTier(SubscriptionTier.PREMIUM)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        questRepository.save(referralQuest);

        QuestEntity premiumLargeTransferQuest = QuestEntity.builder()
                .title("Премиум перевод")
                .description("Сделайте перевод на сумму более 50,000 ₽")
                .questType(QuestType.TRANSFER_AMOUNT)
                .questDifficulty(QuestDifficulty.EXCLUSIVE)
                .conditions(Map.of("min_amount", "50000", "operation_type", "transfer"))
                .rewards(Map.of(
                        "questType", "premium_cashback",
                        "value", "5",
                        "category", "all",
                        "duration", "30days",
                        "prizeName", "Премиальный кэшбэк 5%"
                ))
                .points(15)
                .minAmount(new BigDecimal("50000"))
                .maxCompletions(150)
                .currentCompletions(0)
                .status(QuestStatus.ACTIVE)
                .startDate(Instant.now())
                .endDate(Instant.now().plusSeconds(3600 * 24 * 31))
                .requiredTier(SubscriptionTier.PREMIUM)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        questRepository.save(premiumLargeTransferQuest);

        log.info("Инициализированы {} базовые квесты", questRepository.count());
    }
}