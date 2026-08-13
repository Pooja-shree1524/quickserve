package com.quickserve.tokenqueue.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class GenerateTokenRequest {

    @NotBlank(message = "customerName is required")
    private String customerName;

    @NotEmpty(message = "items must contain at least one item")
    @Valid
    private List<OrderItemDto> items;

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }
}
