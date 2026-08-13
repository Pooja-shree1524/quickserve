package com.quickserve.admin.controller;

import com.quickserve.admin.dto.AnalyticsResponse;
import com.quickserve.admin.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/analytics")
    public AnalyticsResponse getAnalytics() {
        return analyticsService.getAnalytics();
    }
}
