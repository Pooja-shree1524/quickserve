package com.quickserve.service;

import com.quickserve.dto.PickupVerifyResponse;
import com.quickserve.entity.Orders;
import com.quickserve.exception.BadRequestException;
import com.quickserve.repository.OrdersRepository;
import com.quickserve.repository.PaymentRepository;
import com.quickserve.entity.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Handles QR-code pickup pass generation and verification.
 *
 * Security contract:
 *  - QR token is a random UUID prefixed with "QSPICKUP-", generated server-side only.
 *  - 4-digit PIN is a SecureRandom integer, generated server-side only.
 *  - Verification requires BOTH correct QR token AND correct PIN.
 *  - Collection marks order COLLECTED; same QR is rejected on any future attempt.
 *  - Double-collection is prevented by checking status inside a @Transactional block.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PickupService {

    private final OrdersRepository ordersRepository;
    private final PaymentRepository paymentRepository;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    // ─────────────────────────────────────────────────────────────────────────
    //  GENERATION — called after successful payment
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generates a cryptographically-secure QR token and a random 4-digit PIN,
     * saves them to the existing order record, and returns the updated order.
     *
     * Must be called ONLY after payment is confirmed (SUCCESS or DUMMY).
     */
    @Transactional
    public Orders generateAndSavePickupCredentials(Orders order) {
        String qrToken = "QSPICKUP-" + UUID.randomUUID().toString().replace("-", "");
        String pin = String.format("%04d", SECURE_RANDOM.nextInt(10000));

        order.setPickupQrToken(qrToken);
        order.setPickupPin(pin);
        return ordersRepository.save(order);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  VERIFY — admin scans QR, backend checks validity
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Verifies QR token + PIN.
     * Returns a PickupVerifyResponse with valid=true and order summary on success,
     * or valid=false with an error message on failure.
     *
     * Does NOT change the order status — that happens only in markCollected().
     */
    public PickupVerifyResponse verifyPickup(String pickupQrToken, String pickupPin) {
        Optional<Orders> orderOpt = ordersRepository.findByPickupQrToken(pickupQrToken);

        if (orderOpt.isEmpty()) {
            return failed("Invalid QR code. Order not found.");
        }

        Orders order = orderOpt.get();

        if (order.getStatus() == Orders.OrderStatus.COLLECTED) {
            return failed("Order has already been collected.");
        }

        if (order.getStatus() != Orders.OrderStatus.READY) {
            return failed("Order is not ready for pickup yet. Current status: " + order.getStatus());
        }

        // Verify payment
        String paymentStatus = resolvePaymentStatus(order);
        if ("PENDING".equals(paymentStatus) || "FAILED".equals(paymentStatus)) {
            return failed("Payment has not been verified for this order.");
        }

        // Verify PIN
        if (!pickupPin.equals(order.getPickupPin())) {
            return failed("Incorrect pickup PIN.");
        }

        return PickupVerifyResponse.builder()
                .valid(true)
                .orderId(order.getId())
                .token(order.getToken())
                .status(order.getStatus().name())
                .paymentStatus(paymentStatus)
                .items(buildItemSummary(order))
                .message("Verification successful. You may hand over the order.")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  COLLECT — admin clicks "Mark Collected" after verifying
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Performs final verification (QR + PIN again) and atomically transitions
     * the order from READY → COLLECTED, setting collectedAt timestamp.
     *
     * The @Transactional + re-check of status prevents double-collection
     * even if two admin sessions submit the request simultaneously.
     */
    @Transactional
    public PickupVerifyResponse markCollected(String pickupQrToken, String pickupPin) {
        Orders order = ordersRepository.findByPickupQrToken(pickupQrToken)
                .orElseThrow(() -> new BadRequestException("Invalid QR code. Order not found."));

        // Re-verify inside transaction — prevents race condition
        if (order.getStatus() == Orders.OrderStatus.COLLECTED) {
            return failed("Order has already been collected.");
        }

        if (order.getStatus() != Orders.OrderStatus.READY) {
            return failed("Order is not ready for pickup. Current status: " + order.getStatus());
        }

        if (!pickupPin.equals(order.getPickupPin())) {
            return failed("Incorrect pickup PIN.");
        }

        // Atomically mark collected
        order.setStatus(Orders.OrderStatus.COLLECTED);
        order.setCollectedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        ordersRepository.save(order);

        log.info("Order {} marked COLLECTED via QR verification", order.getId());

        return PickupVerifyResponse.builder()
                .valid(true)
                .orderId(order.getId())
                .token(order.getToken())
                .status("COLLECTED")
                .paymentStatus(resolvePaymentStatus(order))
                .items(buildItemSummary(order))
                .message("Order marked as COLLECTED. Food handed over successfully.")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private String resolvePaymentStatus(Orders order) {
        return paymentRepository.findByOrderId(order.getId())
                .map(p -> p.getStatus().name())
                .orElse("DUMMY_PAID");
    }

    private List<PickupVerifyResponse.ItemSummary> buildItemSummary(Orders order) {
        return order.getItems().stream()
                .map(i -> PickupVerifyResponse.ItemSummary.builder()
                        .name(i.getFoodNameSnapshot())
                        .quantity(i.getQuantity())
                        .build())
                .collect(Collectors.toList());
    }

    private static PickupVerifyResponse failed(String message) {
        return PickupVerifyResponse.builder()
                .valid(false)
                .message(message)
                .build();
    }
}
