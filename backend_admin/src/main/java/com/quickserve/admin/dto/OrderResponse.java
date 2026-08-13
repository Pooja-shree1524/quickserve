package com.quickserve.admin.dto;

import com.quickserve.admin.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String tokenNumber;
    private String customerName;
    private List<String> items; // "2x Veg Biryani"
    private BigDecimal totalAmount;
    private OrderStatus status;
    private Integer estimatedWaitMinutes;
    private LocalDateTime createdAt;
}
