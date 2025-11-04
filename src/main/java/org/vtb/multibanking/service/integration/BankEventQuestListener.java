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
        log.debug("Processing transaction event for quests: userId={}", event.getUserId());
        try {
            questEngineService.processTransactionEvent(event.getTransaction(), event.getUserId());
        } catch (Exception e) {
            log.error("Error processing transaction event for quests: {}", e.getMessage());
        }
    }

    @Async
    @EventListener
    public void handleAccountEvent(AccountEvent event) {
        log.debug("Processing account event for quests: userId={}, type={}", event.getUserId(), event.getEventType());
        try {
            if (event.getEventType() == AccountEvent.AccountEventType.OPENED) {
                questEngineService.processAccountEvent(event.getAccount(), event.getUserId());
            }
        } catch (Exception e) {
            log.error("Error processing account event for quests: {}", e.getMessage());
        }
    }

    @Async
    @EventListener
    public void handleProductEvent(ProductEvent event) {
        log.debug("Processing product event for quests: userId={}, type={}", event.getUserId(), event.getEventType());
        try {
            if (event.getEventType() == ProductEvent.ProductEventType.PURCHASED) {
                questEngineService.processProductEvent(event.getProduct(), event.getUserId());
            }
        } catch (Exception e) {
            log.error("Error processing product event for quests: {}", e.getMessage());
        }
    }
}