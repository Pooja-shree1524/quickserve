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
    private int currentCrowd;          // active orders right now (queue depth proxy)
    private String predictedCrowdLevel; // LOW / MODERATE / HIGH based on historical hour pattern
    private double averageWaitingTimeMinutes;
    private String kitchenLoad;        // LIGHT / NORMAL / BUSY / OVERLOADED
    private int activeKitchenOrders;   // ACCEPTED + PREPARING count
}
