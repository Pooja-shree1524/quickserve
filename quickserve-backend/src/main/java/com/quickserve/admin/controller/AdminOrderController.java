package com.quickserve.admin.controller;

import com.quickserve.admin.dto.OrderResponse;
import com.quickserve.admin.dto.OrderStatusUpdateRequest;
import com.quickserve.admin.service.AdminDashboardService;
import com.quickserve.entity.Orders;
import com.quickserve.service.OrderService;
import com.quickserve.repository.OrdersRepository;
import com.quickserve.tokenqueue.service.TokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@Tag(name = "Admin Order Management", description = "Member 4 Order Management APIs")
public class AdminOrderController {

    private final OrdersRepository ordersRepository;
    private final AdminDashboardService adminDashboardService;
    private final TokenService tokenService;
    private final OrderService orderService;

    @Operation(summary = "Get all orders for admin management")
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(@RequestParam(required = false) Orders.OrderStatus status) {
        List<Orders> orders;
        if (status != null) {
            orders = ordersRepository.findByStatus(status);
        } else {
            orders = ordersRepository.findAll();
        }
        List<OrderResponse> responses = orders.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(adminDashboardService::toOrderResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    @Operation(summary = "Update order status via core OrderService with token sync")
    @PutMapping("/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(@Valid @RequestBody OrderStatusUpdateRequest request) {
        // Update status using core service
        Orders updated = orderService.updateStatus(request.getOrderId(), request.getStatus());
        // Synchronize token status if token exists
        if (updated.getToken() != null) {
            try {
                if (request.getStatus() == Orders.OrderStatus.CANCELLED) {
                    tokenService.cancelToken(updated.getToken());
                } else {
                    com.quickserve.tokenqueue.entity.TokenStatus targetStatus = null;
                    switch (request.getStatus()) {
                        case PLACED:
                        case ACCEPTED:
                            targetStatus = com.quickserve.tokenqueue.entity.TokenStatus.Waiting;
                            break;
                        case PREPARING:
                            targetStatus = com.quickserve.tokenqueue.entity.TokenStatus.Preparing;
                            break;
                        case READY:
                            targetStatus = com.quickserve.tokenqueue.entity.TokenStatus.Ready;
                            break;
                        case COLLECTED:
                            targetStatus = com.quickserve.tokenqueue.entity.TokenStatus.Collected;
                            break;
                    }
                    if (targetStatus != null) {
                        tokenService.forceUpdateStatus(updated.getToken(), targetStatus);
                    }
                }
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(adminDashboardService.toOrderResponse(updated));
    }
}
