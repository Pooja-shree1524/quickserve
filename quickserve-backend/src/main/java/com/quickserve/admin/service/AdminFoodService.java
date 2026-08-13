package com.quickserve.admin.service;

import com.quickserve.admin.dto.FoodRequest;
import com.quickserve.entity.Food;
import com.quickserve.exception.ResourceNotFoundException;
import com.quickserve.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminFoodService {

    private final FoodRepository foodRepository;

    public List<Food> getAllFood() {
        return foodRepository.findAll();
    }

    public Food getFoodById(Long id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Food item not found with id " + id));
    }

    public Food addFood(FoodRequest request) {
        Food food = Food.builder()
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .prepTimeMinutes(request.getAvgPrepTimeMinutes() != null ? request.getAvgPrepTimeMinutes() : 10)
                .imageUrl(request.getImageUrl())
                .available(request.getAvailable() == null || request.getAvailable())
                .build();
        return foodRepository.save(food);
    }

    public Food updateFood(Long id, FoodRequest request) {
        Food food = getFoodById(id);
        food.setName(request.getName());
        food.setDescription(request.getDescription());
        food.setCategory(request.getCategory());
        food.setPrice(request.getPrice());
        if (request.getAvgPrepTimeMinutes() != null) {
            food.setPrepTimeMinutes(request.getAvgPrepTimeMinutes());
        }
        food.setImageUrl(request.getImageUrl());
        if (request.getAvailable() != null) {
            food.setAvailable(request.getAvailable());
        }
        return foodRepository.save(food);
    }

    public void deleteFood(Long id) {
        Food food = getFoodById(id);
        foodRepository.delete(food);
    }
}
