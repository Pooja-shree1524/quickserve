package com.quickserve.admin.controller;

import com.quickserve.admin.dto.AiDashboardResponse;
import com.quickserve.admin.dto.DashboardResponse;
import com.quickserve.admin.service.AdminDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Dashboard", description = "Member 4 Admin Dashboard APIs")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @Operation(summary = "Get overall dashboard summary (metrics + recent orders)")
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard() {
        return ResponseEntity.ok(adminDashboardService.getDashboardSummary());
    }

    @Operation(summary = "Get AI dashboard metrics (crowd level, kitchen load, avg wait)")
    @GetMapping("/ai-dashboard")
    public ResponseEntity<AiDashboardResponse> getAiDashboard() {
        return ResponseEntity.ok(adminDashboardService.getAiDashboard());
    }
}
