package com.quickserve.tokenqueue.dto;

import com.quickserve.tokenqueue.entity.TokenStatus;
import java.util.List;

public class CurrentTokenResponse {
    private String currentToken;
    private TokenStatus currentStatus;
    private List<String> next;

    public CurrentTokenResponse(String currentToken, TokenStatus currentStatus, List<String> next) {
        this.currentToken = currentToken;
        this.currentStatus = currentStatus;
        this.next = next;
    }

    public String getCurrentToken() {
        return currentToken;
    }

    public TokenStatus getCurrentStatus() {
        return currentStatus;
    }

    public List<String> getNext() {
        return next;
    }
}
