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
                .title("QuickServe — Smart Token & Queue Module API")
                .description("APIs for digital token generation, AI-assisted queue ordering, "
                        + "and order status tracking. Built by Member 3.")
                .version("1.0.0"));
    }
}
