package com.quickserve.admin.service;

import com.quickserve.admin.dto.DashboardResponse;
import com.quickserve.admin.dto.OrderResponse;
import com.quickserve.admin.entity.FoodOrder;
import com.quickserve.admin.entity.OrderItem;
import com.quickserve.admin.entity.OrderStatus;
import com.quickserve.admin.exception.ResourceNotFoundException;
import com.quickserve.admin.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Set<OrderStatus> ACTIVE_STATUSES =
            Set.of(OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY);

    private final OrderRepository orderRepository;

    public DashboardResponse getDashboard() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);

        long todaysOrders = orderRepository.countByCreatedAtBetween(startOfDay, endOfDay);
        BigDecimal todaysRevenue = orderRepository.sumRevenueBetween(startOfDay, endOfDay);

        long waiting = orderRepository.countByStatus(OrderStatus.PENDING)
                + orderRepository.countByStatus(OrderStatus.ACCEPTED);
        long preparing = orderRepository.countByStatus(OrderStatus.PREPARING);
        long ready = orderRepository.countByStatus(OrderStatus.READY);
        long collected = orderRepository.findByStatus(OrderStatus.COLLECTED).stream()
                .filter(o -> !o.getCreatedAt().isBefore(startOfDay))
                .count();

        List<OrderResponse> activeOrders = orderRepository.findByStatusIn(
                        List.of(OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.PREPARING, OrderStatus.READY))
                .stream()
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .map(this::toResponse)
                .toList();

        return DashboardResponse.builder()
                .todaysOrders(todaysOrders)
                .todaysRevenue(todaysRevenue)
                .waitingOrders(waiting)
                .preparingOrders(preparing)
                .readyOrders(ready)
                .collectedOrders(collected)
                .orders(activeOrders)
                .build();
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    /**
     * Updates order status (accept / reject / preparing / ready / collected).
     * Re-computes the AI estimated wait time whenever an order is accepted,
     * based on current kitchen load and item prep times — this is what feeds
     * the "intelligent token allocation" behaviour described in the brief.
     */
    public OrderResponse updateStatus(Long orderId, OrderStatus newStatus) {
        FoodOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));

        validateTransition(order.getStatus(), newStatus);
        order.setStatus(newStatus);

        if (newStatus == OrderStatus.ACCEPTED) {
            order.setEstimatedWaitMinutes(estimateWaitMinutes(order));
        }

        return toResponse(orderRepository.save(order));
    }

    private void validateTransition(OrderStatus current, OrderStatus next) {
        if (current == OrderStatus.COLLECTED || current == OrderStatus.REJECTED) {
            throw new IllegalArgumentException("Order is already finalized as " + current + " and cannot change");
        }
    }

    /**
     * Simple, explainable AI-style heuristic (swap for a trained model later):
     * base = sum(item avg prep time) weighted by quantity
     * + queue penalty = number of orders currently ACCEPTED/PREPARING * 2 minutes
     */
    private int estimateWaitMinutes(FoodOrder order) {
        int baseMinutes = order.getItems().stream()
                .mapToInt(oi -> oi.getFood().getAvgPrepTimeMinutes() * Math.max(1, oi.getQuantity()))
                .max()
                .orElse(10);

        long activeKitchenOrders = orderRepository.findActiveKitchenOrders().size();
        int queuePenalty = (int) (activeKitchenOrders * 2);

        return baseMinutes + queuePenalty;
    }

    private OrderResponse toResponse(FoodOrder order) {
        List<String> items = order.getItems().stream()
                .map((OrderItem oi) -> oi.getQuantity() + "x " + oi.getFood().getName())
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .tokenNumber(order.getTokenNumber())
                .customerName(order.getCustomer() != null ? order.getCustomer().getName() : "Guest")
                .items(items)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .estimatedWaitMinutes(order.getEstimatedWaitMinutes())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
