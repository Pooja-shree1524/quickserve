package com.quickserve.service;

import com.quickserve.entity.Cart;
import com.quickserve.entity.CartItem;
import com.quickserve.entity.Orders;
import com.quickserve.repository.OrdersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Lightweight AI/heuristic prediction module used by the customer module.
 * Estimates waiting time based on current kitchen workload (active orders)
 * and the complexity/prep time of items in the cart. This provides the
 * "estimated waiting time" surfaced to customers and feeds the intelligent
 * token allocation described in the project brief.
 */
@Service
@RequiredArgsConstructor
public class AiPredictionService {

    private final OrdersRepository ordersRepository;

    private static final List<Orders.OrderStatus> ACTIVE_STATUSES =
            List.of(Orders.OrderStatus.PLACED, Orders.OrderStatus.ACCEPTED, Orders.OrderStatus.PREPARING);

    /** Estimate waiting time (minutes) for a new order based on cart contents + current kitchen load. */
    public int estimateWaitMinutes(Cart cart) {
        int maxPrepTime = cart.getItems().stream()
                .mapToInt(item -> item.getFood().getPrepTimeMinutes() == null ? 10 : item.getFood().getPrepTimeMinutes())
                .max()
                .orElse(10);

        int activeOrders = countActiveOrders();

        // Each active order in the kitchen queue adds contention time.
        int queueDelay = activeOrders * 3;

        return maxPrepTime + queueDelay;
    }

    public int countActiveOrders() {
        return (int) ordersRepository.findAll().stream()
                .filter(o -> ACTIVE_STATUSES.contains(o.getStatus()))
                .count();
    }

    /** Simple peak-hour heuristic based on current active order volume. Used to flag busy periods to admins. */
    public String currentCrowdLevel() {
        int active = countActiveOrders();
        if (active >= 15) return "HIGH";
        if (active >= 6) return "MEDIUM";
        return "LOW";
    }
}
