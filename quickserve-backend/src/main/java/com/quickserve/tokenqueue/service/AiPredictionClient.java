package com.quickserve.tokenqueue.service;

import com.quickserve.tokenqueue.dto.OrderItemDto;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Talks to Member 2's FastAPI AI Prediction Module (waiting-time /
 * peak-hour crowd predictions). This module never depends on it being
 * available: every call is wrapped in a try/catch and falls back to
 * QueueAlgorithmService's local heuristic.
 */
@Component
public class AiPredictionClient {

    private static final Logger log = LoggerFactory.getLogger(AiPredictionClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final boolean enabled;

    public AiPredictionClient(
            RestTemplate restTemplate,
            @Value("${ai.service.base-url:http://localhost:8001}") String baseUrl,
            @Value("${ai.service.enabled:true}") boolean enabled) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
        this.enabled = enabled;
    }

    /**
     * Calls FastAPI POST /predictWaitingTime
     * Payload: { "current_orders": int, "number_of_items": int, "preparation_time": float, "kitchen_load": float }
     * Response: { "estimated_waiting_time_minutes": float, "message": str }
     */
    public Optional<Integer> predictPrepTimeMinutes(List<OrderItemDto> items, long kitchenLoad) {
        if (!enabled || baseUrl == null || baseUrl.isBlank()) {
            return Optional.empty();
        }
        try {
            int numberOfItems = (items != null && !items.isEmpty()) ? items.size() : 1;
            double prepTime = 10.0;
            if (items != null) {
                prepTime = items.stream().mapToDouble(i -> i.getComplexity() * 5.0).sum();
            }
            double kitchenLoadPercent = Math.min(100.0, kitchenLoad * 10.0);

            Map<String, Object> body = new HashMap<>();
            body.put("current_orders", (int) kitchenLoad);
            body.put("number_of_items", numberOfItems);
            body.put("preparation_time", prepTime);
            body.put("kitchen_load", kitchenLoadPercent);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    baseUrl + "/predictWaitingTime", body, Map.class);

            if (response != null) {
                Object val = response.get("estimated_waiting_time_minutes") != null ?
                        response.get("estimated_waiting_time_minutes") : response.get("predicted_waiting_time");
                if (val != null) {
                    double waitTime = ((Number) val).doubleValue();
                    return Optional.of(Math.max(1, (int) Math.round(waitTime)));
                }
            }
            return Optional.empty();
        } catch (RestClientException ex) {
            log.warn("AI prediction service unreachable ({}), falling back to local estimate.", ex.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Calls FastAPI POST /predictCrowd
     * Payload: { "date": "YYYY-MM-DD", "time": "HH:MM", "previous_orders": int }
     * Response: { "crowd_level": str, "confidence": float, "probabilities": dict }
     */
    public Map<String, Object> predictCrowd(String date, String time, int previousOrders) {
        if (!enabled || baseUrl == null || baseUrl.isBlank()) {
            return Map.of("crowd_level", "UNKNOWN", "message", "AI service disabled");
        }
        try {
            String reqDate = (date != null && !date.isBlank()) ? date : LocalDate.now().toString();
            String reqTime = (time != null && !time.isBlank()) ? time : LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm"));

            Map<String, Object> body = new HashMap<>();
            body.put("date", reqDate);
            body.put("time", reqTime);
            body.put("previous_orders", previousOrders);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    baseUrl + "/predictCrowd", body, Map.class);

            return response != null ? response : Map.of();
        } catch (RestClientException ex) {
            log.warn("AI crowd prediction service unreachable ({})", ex.getMessage());
            return Map.of("crowd_level", "UNKNOWN", "error", ex.getMessage());
        }
    }
}
