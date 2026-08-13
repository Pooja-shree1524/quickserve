package com.quickserve.admin.controller;

import com.quickserve.admin.dto.OrderResponse;
import com.quickserve.admin.dto.OrderStatusUpdateRequest;
import com.quickserve.admin.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders();
    }

    /** PUT /api/admin/orders/status — accept / reject / preparing / ready / collected. */
    @PutMapping("/status")
    public OrderResponse updateStatus(@Valid @RequestBody OrderStatusUpdateRequest request) {
        return orderService.updateStatus(request.getOrderId(), request.getStatus());
    }
}
