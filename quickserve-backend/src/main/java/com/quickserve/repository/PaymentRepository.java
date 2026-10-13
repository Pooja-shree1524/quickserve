package com.quickserve.repository;

import com.quickserve.entity.Orders;
import com.quickserve.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByOrderId(Long orderId);
    void deleteByOrderIn(List<Orders> orders);
}
