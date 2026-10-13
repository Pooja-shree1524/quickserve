package com.quickserve.controller;

import com.quickserve.dto.RazorpayOrderRequest;
import com.quickserve.dto.RazorpayVerifyRequest;
import com.quickserve.entity.Orders;
import com.quickserve.entity.User;
import com.quickserve.exception.BadRequestException;
import com.quickserve.security.UserPrincipal;
import com.quickserve.service.OrderService;
import com.quickserve.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Razorpay payment flow:
 *   Step 1: POST /api/payment/create-order  → get razorpayOrderId, open Razorpay modal
 *   Step 2: POST /api/payment/verify        → verify signature, create QuickServe order + token
 */
@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;

    /**
     * Step 1: Create a Razorpay order so the frontend can open the payment modal.
     * The actual QuickServe order is NOT created yet — no payment has happened.
     */
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createRazorpayOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody RazorpayOrderRequest request) {

        BigDecimal amount = request.getAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than zero");
        }
        Map<String, Object> razorpayOrder = paymentService.createRazorpayOrder(amount);
        return ResponseEntity.ok(razorpayOrder);
    }

    /**
     * Step 2: After Razorpay payment succeeds on the frontend, verify the signature here.
     * Only if the signature is valid do we create the QuickServe order + generate token.
     */
    @PostMapping("/verify")
    public ResponseEntity<Orders> verifyAndPlaceOrder(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody RazorpayVerifyRequest request) {

        User user = principal.getUser();

        // Verify the Razorpay payment signature
        boolean valid = paymentService.verifyRazorpaySignature(
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature());

        if (!valid) {
            throw new BadRequestException("Payment verification failed: invalid signature");
        }

        // Signature verified — now create the QuickServe order + token + AI prediction
        Orders order = orderService.placeOrderAfterRazorpay(
                user,
                request.getRazorpayPaymentId(),
                request.getRazorpayOrderId(),
                request.getPickupTime());

        return ResponseEntity.ok(order);
    }
}
