package com.quickserve.repository;

import com.quickserve.entity.Orders;
import com.quickserve.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
public interface OrdersRepository extends JpaRepository<Orders, Long> {
    List<Orders> findByUserOrderByCreatedAtDesc(User user);
    Optional<Orders> findByToken(String token);
    Optional<Orders> findByPickupQrToken(String pickupQrToken);
    long countByCreatedAtAfter(java.time.LocalDateTime after);

    List<Orders> findByStatus(Orders.OrderStatus status);
    List<Orders> findByStatusIn(List<Orders.OrderStatus> statuses);
    List<Orders> findByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    long countByStatus(Orders.OrderStatus status);
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("select coalesce(sum(o.totalAmount), 0) from Orders o " +
           "where o.status <> com.quickserve.entity.Orders.OrderStatus.CANCELLED " +
           "and o.createdAt between :start and :end")
    java.math.BigDecimal sumRevenueBetween(@org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start, @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);

    @org.springframework.data.jpa.repository.Query("select function('date', o.createdAt) as day, count(o) as total " +
           "from Orders o where o.createdAt >= :since " +
           "group by function('date', o.createdAt) order by day asc")
    List<Object[]> countOrdersPerDaySince(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);

    @org.springframework.data.jpa.repository.Query("select function('hour', o.createdAt) as hr, count(o) as total " +
           "from Orders o where o.createdAt >= :since " +
           "group by function('hour', o.createdAt) order by hr asc")
    List<Object[]> countOrdersPerHourSince(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);

    @org.springframework.data.jpa.repository.Query("select oi.foodNameSnapshot as foodName, sum(oi.quantity) as qty " +
           "from OrderItem oi where oi.order.createdAt >= :since " +
           "group by oi.foodNameSnapshot order by qty desc")
    List<Object[]> mostOrderedFoodsSince(@org.springframework.data.repository.query.Param("since") java.time.LocalDateTime since);

    @org.springframework.data.jpa.repository.Query("select o from Orders o where o.status in " +
           "(com.quickserve.entity.Orders.OrderStatus.ACCEPTED, com.quickserve.entity.Orders.OrderStatus.PREPARING, com.quickserve.entity.Orders.OrderStatus.PLACED)")
    List<Orders> findActiveKitchenOrders();
}
