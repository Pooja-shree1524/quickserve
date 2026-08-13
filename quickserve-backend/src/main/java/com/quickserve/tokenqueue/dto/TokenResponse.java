package com.quickserve.tokenqueue.dto;

import com.quickserve.tokenqueue.entity.OrderItem;
import com.quickserve.tokenqueue.entity.Token;
import com.quickserve.tokenqueue.entity.TokenStatus;
import java.time.LocalDateTime;
import java.util.List;

public class TokenResponse {

    private String tokenNumber;
    private String customerName;
    private List<OrderItem> items;
    private int totalComplexity;
    private int estimatedPrepTime;
    private TokenStatus status;
    private double priorityScore;
    private Integer queuePosition;
    private LocalDateTime createdAt;
    private LocalDateTime readyAt;
    private LocalDateTime collectedAt;

    public static TokenResponse from(Token t) {
        TokenResponse r = new TokenResponse();
        r.tokenNumber = t.getTokenNumber();
        r.customerName = t.getCustomerName();
        r.items = t.getItems();
        r.totalComplexity = t.getTotalComplexity();
        r.estimatedPrepTime = t.getEstimatedPrepTime();
        r.status = t.getStatus();
        r.priorityScore = t.getPriorityScore();
        r.queuePosition = t.getQueuePosition();
        r.createdAt = t.getCreatedAt();
        r.readyAt = t.getReadyAt();
        r.collectedAt = t.getCollectedAt();
        return r;
    }

    // ── Getters (needed for JSON serialization) ──

    public String getTokenNumber() {
        return tokenNumber;
    }

    public String getCustomerName() {
        return customerName;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public int getTotalComplexity() {
        return totalComplexity;
    }

    public int getEstimatedPrepTime() {
        return estimatedPrepTime;
    }

    public TokenStatus getStatus() {
        return status;
    }

    public double getPriorityScore() {
        return priorityScore;
    }

    public Integer getQueuePosition() {
        return queuePosition;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getReadyAt() {
        return readyAt;
    }

    public LocalDateTime getCollectedAt() {
        return collectedAt;
    }
}
