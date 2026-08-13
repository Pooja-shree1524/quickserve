package com.quickserve.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CartItemRequest {
    @NotNull
    private Long foodId;

    @Min(1)
    private Integer quantity = 1;
}
