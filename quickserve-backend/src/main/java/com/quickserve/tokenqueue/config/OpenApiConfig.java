package com.quickserve.tokenqueue.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI quickServeOpenApi() {
        return new OpenAPI().info(new Info()
                .title("QuickServe API")
                .description("APIs for User Auth, Foods, Orders, Payments, Digital Token Generation, AI Prediction, and Queue Management.")
                .version("1.0.0"));
    }
}
