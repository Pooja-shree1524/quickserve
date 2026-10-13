package com.quickserve.controller;

import com.quickserve.dto.PickupVerifyRequest;
import com.quickserve.dto.PickupVerifyResponse;
import com.quickserve.exception.BadRequestException;
import com.quickserve.service.PickupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Admin/kitchen endpoints for QR-code pickup verification.
 *
 * Security: mapped under /api/orders/** which requires ADMIN role via SecurityConfig.
 *
 * Flow:
 *   Step 1 → POST /api/orders/verify-pickup  (verify QR + PIN, return order summary)
 *   Step 2 → POST /api/orders/mark-collected (final check, mark order COLLECTED)
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class PickupController {

    private final PickupService pickupService;

    /**
     * Verify the QR token and PIN sent by the admin scanner.
     * Returns order summary if valid. Does NOT change order status.
     */
    @PostMapping("/verify-pickup")
    public ResponseEntity<PickupVerifyResponse> verifyPickup(@RequestBody PickupVerifyRequest request) {
        if (request.getPickupQrToken() == null || request.getPickupQrToken().isBlank()) {
            throw new BadRequestException("pickupQrToken is required");
        }
        if (request.getPickupPin() == null || request.getPickupPin().isBlank()) {
            throw new BadRequestException("pickupPin is required");
        }
        PickupVerifyResponse response = pickupService.verifyPickup(
                request.getPickupQrToken().trim(),
                request.getPickupPin().trim()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Final step: re-verify QR + PIN and atomically mark order as COLLECTED.
     * Idempotent — returns a friendly message if already collected.
     */
    @PostMapping("/mark-collected")
    public ResponseEntity<PickupVerifyResponse> markCollected(@RequestBody PickupVerifyRequest request) {
        if (request.getPickupQrToken() == null || request.getPickupQrToken().isBlank()) {
            throw new BadRequestException("pickupQrToken is required");
        }
        if (request.getPickupPin() == null || request.getPickupPin().isBlank()) {
            throw new BadRequestException("pickupPin is required");
        }
        PickupVerifyResponse response = pickupService.markCollected(
                request.getPickupQrToken().trim(),
                request.getPickupPin().trim()
        );
        return ResponseEntity.ok(response);
    }
}
