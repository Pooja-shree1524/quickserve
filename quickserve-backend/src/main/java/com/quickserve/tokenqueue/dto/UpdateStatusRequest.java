package com.quickserve.tokenqueue.dto;

import com.quickserve.tokenqueue.entity.TokenStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UpdateStatusRequest {

    @NotBlank(message = "tokenNumber is required")
    private String tokenNumber;

    @NotNull(message = "status is required")
    private TokenStatus status;

    public String getTokenNumber() {
        return tokenNumber;
    }

    public void setTokenNumber(String tokenNumber) {
        this.tokenNumber = tokenNumber;
    }

    public TokenStatus getStatus() {
        return status;
    }

    public void setStatus(TokenStatus status) {
        this.status = status;
    }
}
