package com.quickserve.admin.dto;

import com.quickserve.admin.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderStatusUpdateRequest {

    @NotNull(message = "orderId is required")
    private Long orderId;

    @NotNull(message = "status is required")
    private OrderStatus status;
}
