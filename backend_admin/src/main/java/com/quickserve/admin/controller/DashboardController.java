package com.quickserve.admin.controller;

import com.quickserve.admin.dto.AiDashboardResponse;
import com.quickserve.admin.dto.DashboardResponse;
import com.quickserve.admin.service.AiPredictionService;
import com.quickserve.admin.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class DashboardController {

    private final OrderService orderService;
    private final AiPredictionService aiPredictionService;

    /** Summary cards + active order list for the main Admin Dashboard screen. */
    @GetMapping("/dashboard")
    public DashboardResponse getDashboard() {
        return orderService.getDashboard();
    }

    /** Current crowd, predicted crowd, average waiting time, kitchen load. */
    @GetMapping("/ai-dashboard")
    public AiDashboardResponse getAiDashboard() {
        return aiPredictionService.getAiDashboard();
    }
}
