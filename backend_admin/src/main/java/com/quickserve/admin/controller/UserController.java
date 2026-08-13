package com.quickserve.admin.controller;

import com.quickserve.admin.dto.UserResponse;
import com.quickserve.admin.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAllUsers() {
        return userService.getAllCustomers();
    }

    @PutMapping("/{id}/block")
    public UserResponse blockUser(@PathVariable Long id) {
        return userService.setBlocked(id, true);
    }

    @PutMapping("/{id}/unblock")
    public UserResponse unblockUser(@PathVariable Long id) {
        return userService.setBlocked(id, false);
    }
}
