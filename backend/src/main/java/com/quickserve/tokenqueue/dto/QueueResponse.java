package com.quickserve.tokenqueue.dto;

import java.util.List;

public class QueueResponse {
    private long kitchenLoad;
    private List<TokenResponse> preparing;
    private List<TokenResponse> waiting;
    private int queueLength;

    public QueueResponse(long kitchenLoad, List<TokenResponse> preparing, List<TokenResponse> waiting) {
        this.kitchenLoad = kitchenLoad;
        this.preparing = preparing;
        this.waiting = waiting;
        this.queueLength = preparing.size() + waiting.size();
    }

    public long getKitchenLoad() {
        return kitchenLoad;
    }

    public List<TokenResponse> getPreparing() {
        return preparing;
    }

    public List<TokenResponse> getWaiting() {
        return waiting;
    }

    public int getQueueLength() {
        return queueLength;
    }
}
