package com.quickserve.dto;

import lombok.Data;

/** Request body for POST /api/orders/verify-pickup and POST /api/orders/mark-collected */
@Data
public class PickupVerifyRequest {
    private String pickupQrToken;
    private String pickupPin;
}
