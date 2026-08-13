package com.quickserve.admin.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "food_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Food {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private String category; // e.g. Beverages, Snacks, Meals

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /** Average minutes the kitchen takes to prepare this item — feeds the AI waiting-time estimate. */
    @Column(nullable = false)
    @Builder.Default
    private Integer avgPrepTimeMinutes = 5;

    private String imageUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean available = true;
}
