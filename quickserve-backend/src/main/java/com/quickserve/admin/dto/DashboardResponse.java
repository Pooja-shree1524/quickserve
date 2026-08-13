package com.quickserve.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    // Summary cards
    private long todaysOrders;
    private BigDecimal todaysRevenue;
    private long waitingOrders;   // PENDING + ACCEPTED
    private long preparingOrders;
    private long readyOrders;
    private long collectedOrders;

    // Order Management table (active orders needing attention first)
    private List<OrderResponse> orders;
}
