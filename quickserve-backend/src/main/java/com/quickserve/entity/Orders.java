package com.quickserve.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Orders {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human readable token shown to the customer, e.g. A101 */
    @Column(name = "token_number", unique = true, nullable = false)
    private String token;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"orders", "password", "hibernateLazyInitializer"})
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OrderStatus status = OrderStatus.PLACED;

    private LocalDateTime pickupTime;

    /** AI-estimated waiting time in minutes, computed at order placement */
    private Integer estimatedWaitMinutes;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;

    public Integer getPredictedWaitingTime() {
        return this.estimatedWaitMinutes;
    }

    public LocalDateTime getEstimatedCollectionTime() {
        if (this.pickupTime != null) {
            return this.pickupTime;
        }
        if (this.createdAt != null && this.estimatedWaitMinutes != null) {
            return this.createdAt.plusMinutes(this.estimatedWaitMinutes);
        }
        return null;
    }

    public enum OrderStatus {
        PLACED, ACCEPTED, PREPARING, READY, COLLECTED, CANCELLED
    }
}
