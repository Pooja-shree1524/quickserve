package com.quickserve.controller;

import com.quickserve.entity.Food;
import com.quickserve.service.FoodService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods")
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    @GetMapping
    public List<Food> getFoods(@RequestParam(required = false) String category,
                                @RequestParam(required = false) String search) {
        return foodService.getAll(category, search);
    }

    @GetMapping("/{id}")
    public Food getFood(@PathVariable Long id) {
        return foodService.getById(id);
    }
}
