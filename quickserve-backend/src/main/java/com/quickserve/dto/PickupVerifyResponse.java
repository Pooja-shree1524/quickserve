package com.quickserve.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/** Response returned to the admin after QR + PIN verification. */
@Data
@Builder
public class PickupVerifyResponse {

    private boolean valid;

    // Order info — only the minimum needed
    private Long orderId;
    private String token;
    private String status;
    private String paymentStatus;

    /** Items summary (no sensitive personal data) */
    private List<ItemSummary> items;

    /** Human-readable message for the admin UI */
    private String message;

    @Data
    @Builder
    public static class ItemSummary {
        private String name;
        private int quantity;
    }
}
