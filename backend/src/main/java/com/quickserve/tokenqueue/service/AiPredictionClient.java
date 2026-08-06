package com.quickserve.tokenqueue.service;

import com.quickserve.tokenqueue.dto.OrderItemDto;
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
 * peak-hour crowd predictions). This module (Member 3) never depends
 * on it being available: every call is wrapped in a try/catch and
 * falls back to QueueAlgorithmService's local heuristic, so a demo or
 * a down AI service never breaks token generation.
 *
 * Expected contract with Member 2 (adjust to match their actual API):
 *
 *   POST {ai.service.base-url}/api/predict/prep-time
 *   Request:  { "items": [{"name": "...", "complexity": 1}], "kitchenLoad": 3 }
 *   Response: { "estimatedPrepTimeMinutes": 12 }
 */
@Component
public class AiPredictionClient {

    private static final Logger log = LoggerFactory.getLogger(AiPredictionClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final boolean enabled;

    public AiPredictionClient(
            RestTemplate restTemplate,
            @Value("${ai.service.base-url:}") String baseUrl,
            @Value("${ai.service.enabled:false}") boolean enabled) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
        this.enabled = enabled;
    }

    public Optional<Integer> predictPrepTimeMinutes(List<OrderItemDto> items, long kitchenLoad) {
        if (!enabled || baseUrl == null || baseUrl.isBlank()) {
            return Optional.empty();
        }
        try {
            Map<String, Object> body = Map.of("items", items, "kitchenLoad", kitchenLoad);
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    baseUrl + "/api/predict/prep-time", body, Map.class);

            if (response != null && response.get("estimatedPrepTimeMinutes") != null) {
                return Optional.of(((Number) response.get("estimatedPrepTimeMinutes")).intValue());
            }
            return Optional.empty();
        } catch (RestClientException ex) {
            log.warn("AI prediction service unreachable ({}), falling back to local estimate.", ex.getMessage());
            return Optional.empty();
        }
    }
}
