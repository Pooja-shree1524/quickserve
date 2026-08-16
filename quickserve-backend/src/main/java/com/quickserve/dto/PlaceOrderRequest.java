package com.quickserve.dto;

import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Data
public class PlaceOrderRequest {
    /** Desired pickup time chosen by the customer */
    private LocalDateTime pickupTime;

    /** DUMMY or RAZORPAY */
    private String paymentMethod = "DUMMY";

    @JsonSetter("pickupTime")
    public void setPickupTimeFlexible(Object value) {
        if (value == null) {
            this.pickupTime = null;
            return;
        }
        if (value instanceof String str) {
            if (str.isBlank()) {
                this.pickupTime = null;
                return;
            }
            try {
                // Parse ISO instant e.g. "2026-08-15T07:28:54.000Z"
                Instant instant = Instant.parse(str);
                this.pickupTime = LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
                return;
            } catch (Exception ignored) {}
            try {
                // Parse ISO local datetime e.g. "2026-08-15T07:28:54"
                this.pickupTime = LocalDateTime.parse(str);
                return;
            } catch (Exception ignored) {}
            try {
                // Parse datetime without seconds e.g. "2026-08-15T07:28"
                this.pickupTime = LocalDateTime.parse(str, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
                return;
            } catch (Exception ignored) {}
        }
        this.pickupTime = LocalDateTime.now().plusMinutes(20);
    }
}

