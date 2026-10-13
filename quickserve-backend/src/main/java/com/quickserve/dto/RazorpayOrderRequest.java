package com.quickserve.dto;

import lombok.Data;
import java.math.BigDecimal;

/** Request body for POST /api/payment/create-order */
@Data
public class RazorpayOrderRequest {
    /** Cart total in INR (rupees) */
    private BigDecimal amount;
}
