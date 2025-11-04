package org.vtb.multibanking.model.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;
import org.vtb.multibanking.model.Transaction;

@Getter
public class TransactionEvent extends ApplicationEvent {
    private final Transaction transaction;
    private final String userId;

    public TransactionEvent(Object source, Transaction transaction, String userId) {
        super(source);
        this.transaction = transaction;
        this.userId = userId;
    }
}
