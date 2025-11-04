package org.vtb.multibanking.model.events;

import lombok.Getter;
import org.springframework.context.ApplicationEvent;
import org.vtb.multibanking.model.Product;

@Getter
public class ProductEvent extends ApplicationEvent {
    private final Product product;
    private final String userId;
    private final ProductEventType eventType;

    public ProductEvent(Object source, Product product, String userId, ProductEventType eventType) {
        super(source);
        this.product = product;
        this.userId = userId;
        this.eventType = eventType;
    }

    public enum ProductEventType {
        PURCHASED, CANCELLED, ACTIVATED
    }
}