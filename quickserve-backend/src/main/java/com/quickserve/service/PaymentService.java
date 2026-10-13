package com.quickserve.service;

import com.quickserve.entity.Orders;
import com.quickserve.entity.Payment;
import com.quickserve.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

/**
 * Handles payment processing.
 * - DUMMY: always succeeds (demo mode)
 * - RAZORPAY: real test-mode order creation + HMAC-SHA256 signature verification
 */
@Service
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;

    @Value("${razorpay.key.id:rzp_test_REPLACE_WITH_YOUR_KEY}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:REPLACE_WITH_YOUR_SECRET}")
    private String razorpayKeySecret;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    // ─────────────────────────────────────────────────────────
    //  Step 1 of Razorpay flow: Create Razorpay Order
    //  Called BEFORE the student's money moves anywhere.
    // ─────────────────────────────────────────────────────────
    public Map<String, Object> createRazorpayOrder(BigDecimal amount) {
        try {
            RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);

            JSONObject options = new JSONObject();
            // Razorpay expects amount in smallest currency unit (paise for INR)
            options.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue());
            options.put("currency", "INR");
            options.put("receipt", "qs_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
            options.put("payment_capture", 1);

            Order razorpayOrder = client.orders.create(options);

            Map<String, Object> response = new HashMap<>();
            response.put("razorpayOrderId", razorpayOrder.get("id"));
            response.put("amount", amount);
            response.put("currency", "INR");
            response.put("keyId", razorpayKeyId);
            return response;

        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order: {}", e.getMessage());
            throw new RuntimeException("Could not initialize Razorpay payment: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────
    //  Step 2 of Razorpay flow: Verify Payment Signature
    //  Backend verifies: HMAC_SHA256(razorpayOrderId|razorpayPaymentId, secret)
    //  Only after this passes is the order confirmed.
    // ─────────────────────────────────────────────────────────
    public boolean verifyRazorpaySignature(String razorpayOrderId,
                                           String razorpayPaymentId,
                                           String razorpaySignature) {
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(razorpayKeySecret.getBytes(), "HmacSHA256"));
            byte[] digest = mac.doFinal(payload.getBytes());
            String computed = HexFormat.of().formatHex(digest);
            return computed.equals(razorpaySignature);
        } catch (Exception e) {
            log.error("Signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────
    //  Record payment after verification (used by PaymentController)
    // ─────────────────────────────────────────────────────────
    public Payment recordRazorpayPayment(Orders order,
                                         String razorpayPaymentId,
                                         String razorpayOrderId) {
        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .method("RAZORPAY")
                .transactionRef(razorpayPaymentId)
                .razorpayOrderId(razorpayOrderId)
                .status(Payment.PaymentStatus.SUCCESS)
                .build();
        return paymentRepository.save(payment);
    }

    // ─────────────────────────────────────────────────────────
    //  Existing: process payment inline (DUMMY only path)
    // ─────────────────────────────────────────────────────────
    public Payment processPayment(Orders order, String method) {
        // Only DUMMY is handled here now; RAZORPAY goes through PaymentController
        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .method("DUMMY")
                .transactionRef("dummy_" + UUID.randomUUID())
                .status(Payment.PaymentStatus.SUCCESS)
                .build();
        return paymentRepository.save(payment);
    }
}
