package com.quickserve.admin.controller;

import com.quickserve.admin.dto.FoodRequest;
import com.quickserve.admin.entity.Food;
import com.quickserve.admin.service.FoodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/food")
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    @GetMapping
    public List<Food> getAllFood() {
        return foodService.getAllFood();
    }

    @PostMapping
    public ResponseEntity<Food> addFood(@Valid @RequestBody FoodRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(foodService.addFood(request));
    }

    /** PUT /api/admin/food/{id} — full update of a food item. */
    @PutMapping("/{id}")
    public Food updateFood(@PathVariable Long id, @Valid @RequestBody FoodRequest request) {
        return foodService.updateFood(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFood(@PathVariable Long id) {
        foodService.deleteFood(id);
        return ResponseEntity.noContent().build();
    }
}
