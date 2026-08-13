package com.quickserve.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PlaceOrderRequest {
    /** Desired pickup time chosen by the customer */
    private LocalDateTime pickupTime;

    /** DUMMY or RAZORPAY */
    private String paymentMethod = "DUMMY";
}
