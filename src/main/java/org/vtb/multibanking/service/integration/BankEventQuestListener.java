package org.vtb.multibanking.service.integration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.vtb.multibanking.model.events.AccountEvent;
import org.vtb.multibanking.model.events.ProductEvent;
import org.vtb.multibanking.model.events.TransactionEvent;
import org.vtb.multibanking.service.quest.QuestEngineService;

@Slf4j
@Service
@RequiredArgsConstructor
public class BankEventQuestListener {

    private final QuestEngineService questEngineService;

    @Async
    @EventListener
    public void handleTransactionEvent(TransactionEvent event) {
        log.debug("Обработка квестовой транзакции: пользователь(ница)={}", event.getUserId());
        try {
            questEngineService.processTransactionEvent(event.getTransaction(), event.getUserId());
        } catch (Exception e) {
            log.error("Ошибка при обработке квестовой транзакции: {}", e.getMessage());
        }
    }

    @Async
    @EventListener
    public void handleAccountEvent(AccountEvent event) {
        log.debug("Обработка квестного открытия счёта: пользователь(ница)={}, тип={}", event.getUserId(), event.getEventType());
        try {
            if (event.getEventType() == AccountEvent.AccountEventType.OPENED) {
                questEngineService.processAccountEvent(event.getAccount(), event.getUserId());
            }
        } catch (Exception e) {
            log.error("Ошибка при обработке квестового открытия счёта: {}", e.getMessage());
        }
    }

    @Async
    @EventListener
    public void handleProductEvent(ProductEvent event) {
        log.debug("Обработка квестовой покупки продукта: пользователь(ница)={}, тип={}", event.getUserId(), event.getEventType());
        try {
            if (event.getEventType() == ProductEvent.ProductEventType.PURCHASED) {
                questEngineService.processProductEvent(event.getProduct(), event.getUserId());
            }
        } catch (Exception e) {
            log.error("Ошибка обработки квестовой покупки продукта: {}", e.getMessage());
        }
    }
}