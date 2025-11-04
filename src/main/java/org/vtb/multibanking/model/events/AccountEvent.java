package org.vtb.multibanking.model.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;
import org.vtb.multibanking.model.Account;

@Getter
public class AccountEvent extends ApplicationEvent {
    private final Account account;
    private final String userId;
    private final AccountEventType eventType;

    public AccountEvent(Object source, Account account, String userId, AccountEventType eventType) {
        super(source);
        this.account = account;
        this.userId = userId;
        this.eventType = eventType;
    }

    public enum AccountEventType {
        OPENED, CLOSED, UPDATED
    }
}