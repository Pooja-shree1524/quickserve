package com.quickserve.admin.service;

import com.quickserve.admin.dto.AiDashboardResponse;
import com.quickserve.admin.dto.DashboardResponse;
import com.quickserve.admin.dto.OrderResponse;
import com.quickserve.entity.Orders;
import com.quickserve.entity.Payment;
import com.quickserve.repository.OrdersRepository;
import com.quickserve.repository.PaymentRepository;
import com.quickserve.tokenqueue.service.AiPredictionClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final OrdersRepository ordersRepository;
    private final AiPredictionClient aiPredictionClient;
    private final PaymentRepository paymentRepository;

    public DashboardResponse getDashboardSummary() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        long todaysOrders = ordersRepository.countByCreatedAtBetween(startOfDay, endOfDay);
        BigDecimal todaysRevenue = ordersRepository.sumRevenueBetween(startOfDay, endOfDay);

        long waiting = ordersRepository.countByStatus(Orders.OrderStatus.PLACED)
                + ordersRepository.countByStatus(Orders.OrderStatus.ACCEPTED);
        long preparing = ordersRepository.countByStatus(Orders.OrderStatus.PREPARING);
        long ready = ordersRepository.countByStatus(Orders.OrderStatus.READY);
        long collected = ordersRepository.countByStatus(Orders.OrderStatus.COLLECTED);

        List<OrderResponse> recentOrders = ordersRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(20)
                .map(this::toOrderResponse)
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .todaysOrders(todaysOrders)
                .todaysRevenue(todaysRevenue != null ? todaysRevenue : BigDecimal.ZERO)
                .waitingOrders(waiting)
                .preparingOrders(preparing)
                .readyOrders(ready)
                .collectedOrders(collected)
                .orders(recentOrders)
                .build();
    }

    public AiDashboardResponse getAiDashboard() {
        List<Orders> activeKitchenOrders = ordersRepository.findActiveKitchenOrders();
        int activeCount = activeKitchenOrders.size();

        double avgWait = activeKitchenOrders.stream()
                .map(Orders::getEstimatedWaitMinutes)
                .filter(java.util.Objects::nonNull)
                .mapToInt(Integer::intValue)
                .average()
                .orElse(10.0);

        String kitchenLoad;
        if (activeCount <= 3) kitchenLoad = "LIGHT";
        else if (activeCount <= 8) kitchenLoad = "NORMAL";
        else if (activeCount <= 15) kitchenLoad = "BUSY";
        else kitchenLoad = "OVERLOADED";

        Map<String, Object> crowdRes = aiPredictionClient.predictCrowd(
                LocalDate.now().toString(),
                LocalTime.now().toString(),
                activeCount
        );
        String predictedCrowd = (String) crowdRes.getOrDefault("crowd_level", "LOW");
        if ("UNKNOWN".equals(predictedCrowd)) {
            if (activeCount <= 5) predictedCrowd = "LOW";
            else if (activeCount <= 15) predictedCrowd = "MODERATE";
            else predictedCrowd = "HIGH";
        }

        return AiDashboardResponse.builder()
                .currentCrowd(activeCount)
                .predictedCrowdLevel(predictedCrowd)
                .averageWaitingTimeMinutes(Math.round(avgWait * 10.0) / 10.0)
                .kitchenLoad(kitchenLoad)
                .activeKitchenOrders(activeCount)
                .build();
    }

    public OrderResponse toOrderResponse(Orders order) {
        List<String> items = order.getItems().stream()
                .map(i -> i.getQuantity() + "x " + i.getFoodNameSnapshot())
                .collect(Collectors.toList());

        // Lookup payment status from payments table
        // estimatedWaitMinutes = AI-predicted total waiting time (queue wait + preparation combined)
        // estimatedPickupTime  = order.createdAt + estimatedWaitMinutes (verified)
        String paymentStatus = "PAID (DUMMY)";
        Optional<Payment> paymentOpt = paymentRepository.findByOrderId(order.getId());
        if (paymentOpt.isPresent()) {
            Payment p = paymentOpt.get();
            paymentStatus = "RAZORPAY".equals(p.getMethod())
                    ? p.getStatus().name()   // SUCCESS / PENDING / FAILED
                    : "PAID (DUMMY)";
        }

        LocalDateTime estimatedPickupTime = null;
        if (order.getCreatedAt() != null && order.getEstimatedWaitMinutes() != null) {
            estimatedPickupTime = order.getCreatedAt().plusMinutes(order.getEstimatedWaitMinutes());
        }

        return OrderResponse.builder()
                .id(order.getId())
                .tokenNumber(order.getToken() != null ? order.getToken() : "QS-" + (1000 + order.getId()))
                .customerName(order.getUser() != null ? order.getUser().getName() : "Customer")
                .items(items)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .estimatedWaitMinutes(order.getEstimatedWaitMinutes())
                .paymentStatus(paymentStatus)
                .estimatedPickupTime(estimatedPickupTime)
                .createdAt(order.getCreatedAt())
                .build();
    }
}
