package com.quickserve.service;

import com.quickserve.entity.Orders;
import com.quickserve.entity.Payment;
import com.quickserve.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Handles payment for orders. Defaults to a DUMMY payment gateway that always
 * succeeds, so the flow can be demoed end-to-end without a live Razorpay key.
 * Swap processDummyPayment() for a real Razorpay order/verify call when ready.
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public Payment processPayment(Orders order, String method) {
        String chosenMethod = (method == null || method.isBlank()) ? "DUMMY" : method.toUpperCase();

        Payment payment = Payment.builder()
                .order(order)
                .amount(order.getTotalAmount())
                .method(chosenMethod)
                .build();

        if ("RAZORPAY".equals(chosenMethod)) {
            // Placeholder for real Razorpay order creation / signature verification.
            payment.setTransactionRef("rzp_" + UUID.randomUUID());
            payment.setStatus(Payment.PaymentStatus.SUCCESS);
        } else {
            payment.setTransactionRef("dummy_" + UUID.randomUUID());
            payment.setStatus(Payment.PaymentStatus.SUCCESS);
        }

        return paymentRepository.save(payment);
    }
}
