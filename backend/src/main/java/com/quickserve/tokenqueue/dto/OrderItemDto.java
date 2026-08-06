package com.quickserve.tokenqueue.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class OrderItemDto {

    @NotBlank(message = "item name is required")
    private String name;

    @Min(value = 1, message = "complexity must be 1 (Simple), 2 (Medium), or 3 (Complex)")
    @Max(value = 3, message = "complexity must be 1 (Simple), 2 (Medium), or 3 (Complex)")
    private int complexity = 2;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getComplexity() {
        return complexity;
    }

    public void setComplexity(int complexity) {
        this.complexity = complexity;
    }
}
