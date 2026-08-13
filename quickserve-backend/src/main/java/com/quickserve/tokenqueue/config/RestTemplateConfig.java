package com.quickserve.tokenqueue.config;

import java.time.Duration;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    /**
     * Used by AiPredictionClient to call Member 2's FastAPI AI Prediction Module.
     * Short timeouts so a slow/unreachable AI service never blocks token generation —
     * we always fall back to the local estimate (see AiPredictionClient).
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(2))
                .setReadTimeout(Duration.ofSeconds(3))
                .build();
    }
}
