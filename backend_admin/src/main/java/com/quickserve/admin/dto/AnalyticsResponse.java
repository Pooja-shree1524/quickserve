package com.quickserve.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private Map<String, Long> ordersPerDay;      // "2026-08-01" -> count
    private Map<Integer, Long> peakHours;         // hour (0-23) -> count
    private List<FoodPopularity> mostOrderedFoods;
    private BigDecimal revenueLast7Days;
    private Double averageWaitMinutes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FoodPopularity {
        private String foodName;
        private long quantitySold;
    }
}
