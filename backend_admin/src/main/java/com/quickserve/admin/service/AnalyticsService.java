package com.quickserve.admin.service;

import com.quickserve.admin.dto.AnalyticsResponse;
import com.quickserve.admin.entity.FoodOrder;
import com.quickserve.admin.entity.OrderStatus;
import com.quickserve.admin.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;

    public AnalyticsResponse getAnalytics() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        Map<String, Long> ordersPerDay = new LinkedHashMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (Object[] row : orderRepository.countOrdersPerDaySince(sevenDaysAgo)) {
            String day = row[0] instanceof java.sql.Date d ? d.toLocalDate().format(fmt) : String.valueOf(row[0]);
            ordersPerDay.put(day, ((Number) row[1]).longValue());
        }

        Map<Integer, Long> peakHours = new LinkedHashMap<>();
        for (Object[] row : orderRepository.countOrdersPerHourSince(sevenDaysAgo)) {
            peakHours.put(((Number) row[0]).intValue(), ((Number) row[1]).longValue());
        }

        List<AnalyticsResponse.FoodPopularity> mostOrdered = orderRepository.mostOrderedFoodsSince(sevenDaysAgo)
                .stream()
                .limit(10)
                .map(row -> AnalyticsResponse.FoodPopularity.builder()
                        .foodName((String) row[0])
                        .quantitySold(((Number) row[1]).longValue())
                        .build())
                .toList();

        var revenue = orderRepository.sumRevenueBetween(sevenDaysAgo, LocalDateTime.now());

        double avgWait = orderRepository.findByStatusIn(
                        List.of(OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COLLECTED))
                .stream()
                .map(FoodOrder::getEstimatedWaitMinutes)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(0.0);

        return AnalyticsResponse.builder()
                .ordersPerDay(ordersPerDay)
                .peakHours(peakHours)
                .mostOrderedFoods(mostOrdered)
                .revenueLast7Days(revenue)
                .averageWaitMinutes(Math.round(avgWait * 10.0) / 10.0)
                .build();
    }
}
