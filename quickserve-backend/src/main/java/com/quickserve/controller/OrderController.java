package com.quickserve.controller;

import com.quickserve.dto.PlaceOrderRequest;
import com.quickserve.entity.Orders;
import com.quickserve.security.UserPrincipal;
import com.quickserve.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/order")
    public ResponseEntity<Orders> placeOrder(@AuthenticationPrincipal UserPrincipal principal,
                                              @RequestBody PlaceOrderRequest request) {
        Orders order = orderService.placeOrder(principal.getUser(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/orders")
    public List<Orders> getOrderHistory(@AuthenticationPrincipal UserPrincipal principal) {
        return orderService.getOrderHistory(principal.getUser());
    }

    @GetMapping("/orders/{id}")
    public Orders getOrder(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return orderService.getOrderForUser(principal.getUser(), id);
    }

    @GetMapping("/track/{id}")
    public Orders trackOrder(@PathVariable Long id) {
        return orderService.trackOrder(id);
    }

    /** Admin/kitchen endpoint to advance an order through the status pipeline. */
    @PatchMapping("/orders/{id}/status")
    public Orders updateStatus(@PathVariable Long id, @RequestParam Orders.OrderStatus status) {
        return orderService.updateStatus(id, status);
    }
}
