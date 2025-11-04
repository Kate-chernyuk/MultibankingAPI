package org.vtb.multibanking.service.integration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.vtb.multibanking.model.Account;
import org.vtb.multibanking.model.Product;
import org.vtb.multibanking.model.Transaction;
import org.vtb.multibanking.model.events.AccountEvent;
import org.vtb.multibanking.model.events.ProductEvent;
import org.vtb.multibanking.model.events.TransactionEvent;

@Slf4j
@Service
@RequiredArgsConstructor
public class BankEventPublisher {

    public final ApplicationEventPublisher eventPublisher;

    public void publishTransactionEvent(Transaction transaction, String userId) {
        log.debug("Publishing transaction event for user: {}", userId);
        eventPublisher.publishEvent(new TransactionEvent(this, transaction, userId));
    }

    public void publishAccountEvent(Account account, String userId, AccountEvent.AccountEventType eventType) {
        log.debug("Publishing account event for user: {}, type: {}", (Object) userId, eventType);
        eventPublisher.publishEvent(new AccountEvent(this, account, userId, eventType));
    }

    public void publishProductEvent(Product product, String userId, ProductEvent.ProductEventType eventType) {
        log.debug("Publishing product event for user: {}, type: {}", userId, eventType);
        eventPublisher.publishEvent(new ProductEvent(this, product, userId, eventType));
    }
}
