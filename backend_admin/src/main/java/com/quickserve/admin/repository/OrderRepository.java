package com.quickserve.admin.repository;

import com.quickserve.admin.entity.FoodOrder;
import com.quickserve.admin.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<FoodOrder, Long> {

    List<FoodOrder> findByStatus(OrderStatus status);

    List<FoodOrder> findByStatusIn(List<OrderStatus> statuses);

    List<FoodOrder> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    long countByStatus(OrderStatus status);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("select coalesce(sum(o.totalAmount), 0) from FoodOrder o " +
           "where o.status <> com.quickserve.admin.entity.OrderStatus.REJECTED " +
           "and o.createdAt between :start and :end")
    java.math.BigDecimal sumRevenueBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("select function('date', o.createdAt) as day, count(o) as total " +
           "from FoodOrder o where o.createdAt >= :since " +
           "group by function('date', o.createdAt) order by day asc")
    List<Object[]> countOrdersPerDaySince(@Param("since") LocalDateTime since);

    @Query("select function('hour', o.createdAt) as hr, count(o) as total " +
           "from FoodOrder o where o.createdAt >= :since " +
           "group by function('hour', o.createdAt) order by hr asc")
    List<Object[]> countOrdersPerHourSince(@Param("since") LocalDateTime since);

    @Query("select oi.food.name as foodName, sum(oi.quantity) as qty " +
           "from OrderItem oi where oi.order.createdAt >= :since " +
           "group by oi.food.name order by qty desc")
    List<Object[]> mostOrderedFoodsSince(@Param("since") LocalDateTime since);

    @Query("select o from FoodOrder o where o.status in " +
           "(com.quickserve.admin.entity.OrderStatus.ACCEPTED, com.quickserve.admin.entity.OrderStatus.PREPARING)")
    List<FoodOrder> findActiveKitchenOrders();
}
