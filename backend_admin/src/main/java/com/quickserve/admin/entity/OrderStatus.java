package com.quickserve.admin.entity;

/**
 * Lifecycle of an order/token as it moves through the kitchen.
 * PENDING -> (ACCEPTED | REJECTED) -> PREPARING -> READY -> COLLECTED
 */
public enum OrderStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    PREPARING,
    READY,
    COLLECTED
}
