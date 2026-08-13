package com.quickserve.admin.controller;

import com.quickserve.admin.dto.UserResponse;
import com.quickserve.admin.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin User Management", description = "Member 4 User Management APIs")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @Operation(summary = "Get all customer users")
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllCustomers() {
        return ResponseEntity.ok(adminUserService.getAllCustomers());
    }

    @Operation(summary = "Block a customer user")
    @PutMapping("/{id}/block")
    public ResponseEntity<UserResponse> blockUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.setBlocked(id, true));
    }

    @Operation(summary = "Unblock a customer user")
    @PutMapping("/{id}/unblock")
    public ResponseEntity<UserResponse> unblockUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.setBlocked(id, false));
    }
}
