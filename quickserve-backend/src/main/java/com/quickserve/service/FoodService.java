package com.quickserve.service;

import com.quickserve.entity.Food;
import com.quickserve.exception.ResourceNotFoundException;
import com.quickserve.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FoodService {

    private final FoodRepository foodRepository;

    public List<Food> getAll(String category, String search) {
        if (search != null && !search.isBlank()) {
            return foodRepository.findByNameContainingIgnoreCase(search);
        }
        if (category != null && !category.isBlank()) {
            return foodRepository.findByCategoryIgnoreCase(category);
        }
        return foodRepository.findAll();
    }

    public Food getById(Long id) {
        return foodRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Food item not found"));
    }
}
