package com.quickserve.admin.service;

import com.quickserve.admin.dto.AiDashboardResponse;
import com.quickserve.admin.entity.FoodOrder;
import com.quickserve.admin.entity.OrderStatus;
import com.quickserve.admin.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Lightweight, explainable prediction engine backing the "AI Dashboard" panel.
 * This is intentionally rule-based so it runs with zero external ML dependency;
 * swap the internals for a trained model later without touching the API contract.
 */
@Service
@RequiredArgsConstructor
public class AiPredictionService {

    private final OrderRepository orderRepository;

    public AiDashboardResponse getAiDashboard() {
        List<FoodOrder> activeKitchenOrders = orderRepository.findActiveKitchenOrders();
        int currentCrowd = activeKitchenOrders.size()
                + (int) orderRepository.countByStatus(OrderStatus.PENDING)
                + (int) orderRepository.countByStatus(OrderStatus.READY);

        double avgWait = activeKitchenOrders.stream()
                .map(FoodOrder::getEstimatedWaitMinutes)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(10.0);

        String kitchenLoad = classifyKitchenLoad(activeKitchenOrders.size());
        String predictedCrowd = predictCrowdForThisHour();

        return AiDashboardResponse.builder()
                .currentCrowd(currentCrowd)
                .predictedCrowdLevel(predictedCrowd)
                .averageWaitingTimeMinutes(Math.round(avgWait * 10.0) / 10.0)
                .kitchenLoad(kitchenLoad)
                .activeKitchenOrders(activeKitchenOrders.size())
                .build();
    }

    private String classifyKitchenLoad(int activeOrders) {
        if (activeOrders <= 3) return "LIGHT";
        if (activeOrders <= 8) return "NORMAL";
        if (activeOrders <= 15) return "BUSY";
        return "OVERLOADED";
    }

    /**
     * Predicts crowd level for the current hour using the historical order count
     * for that same hour-of-day over the last 7 days.
     */
    private String predictCrowdForThisHour() {
        int currentHour = LocalDateTime.now().getHour();
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        Map<Integer, Long> hourlyHistory = new java.util.HashMap<>();
        for (Object[] row : orderRepository.countOrdersPerHourSince(sevenDaysAgo)) {
            hourlyHistory.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        long ordersThisHourHistorically = hourlyHistory.getOrDefault(currentHour, 0L);

        if (ordersThisHourHistorically <= 5) return "LOW";
        if (ordersThisHourHistorically <= 15) return "MODERATE";
        return "HIGH";
    }
}
