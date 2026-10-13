package com.quickserve.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/** Request body for POST /api/payment/verify */
@Data
public class RazorpayVerifyRequest {
    /** Razorpay order ID returned by /api/payment/create-order */
    private String razorpayOrderId;
    /** Razorpay payment ID returned by the Razorpay JS modal on success */
    private String razorpayPaymentId;
    /** HMAC-SHA256 signature returned by Razorpay modal */
    private String razorpaySignature;
    /** Optional pickup time chosen by student */
    private LocalDateTime pickupTime;

    @JsonSetter("pickupTime")
    public void setPickupTimeFlexible(Object value) {
        if (value == null) { this.pickupTime = null; return; }
        if (value instanceof String str) {
            if (str.isBlank()) { this.pickupTime = null; return; }
            try { this.pickupTime = LocalDateTime.ofInstant(Instant.parse(str), ZoneId.systemDefault()); return; } catch (Exception ignored) {}
            try { this.pickupTime = LocalDateTime.parse(str); return; } catch (Exception ignored) {}
            try { this.pickupTime = LocalDateTime.parse(str, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")); return; } catch (Exception ignored) {}
        }
        this.pickupTime = LocalDateTime.now().plusMinutes(20);
    }
}
