package com.quickserve.admin.controller;

import com.quickserve.admin.dto.FoodRequest;
import com.quickserve.admin.service.AdminFoodService;
import com.quickserve.entity.Food;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/food")
@RequiredArgsConstructor
@Tag(name = "Admin Food Management", description = "Member 4 Food CRUD APIs")
public class AdminFoodController {

    private final AdminFoodService adminFoodService;

    @Operation(summary = "Get all food items for admin view")
    @GetMapping
    public ResponseEntity<List<Food>> getAllFood() {
        return ResponseEntity.ok(adminFoodService.getAllFood());
    }

    @Operation(summary = "Add a new food item")
    @PostMapping
    public ResponseEntity<Food> addFood(@Valid @RequestBody FoodRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminFoodService.addFood(request));
    }

    @Operation(summary = "Update an existing food item")
    @PutMapping("/{id}")
    public ResponseEntity<Food> updateFood(@PathVariable Long id, @Valid @RequestBody FoodRequest request) {
        return ResponseEntity.ok(adminFoodService.updateFood(id, request));
    }

    @Operation(summary = "Delete a food item")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFood(@PathVariable Long id) {
        adminFoodService.deleteFood(id);
        return ResponseEntity.noContent().build();
    }
}
