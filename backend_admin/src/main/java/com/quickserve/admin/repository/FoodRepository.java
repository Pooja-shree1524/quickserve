package com.quickserve.admin.repository;

import com.quickserve.admin.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodRepository extends JpaRepository<Food, Long> {
    boolean existsByNameIgnoreCase(String name);
}
