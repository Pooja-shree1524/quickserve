package com.quickserve.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiDashboardResponse {
    private int currentCrowd;
    private String predictedCrowdLevel;
    private double averageWaitingTimeMinutes;
    private String kitchenLoad;
    private int activeKitchenOrders;
}
