package com.quickserve.controller;

import com.quickserve.dto.UserProfileRequest;
import com.quickserve.entity.User;
import com.quickserve.security.UserPrincipal;
import com.quickserve.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public User getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return userService.getById(principal.getUserId());
    }

    @PutMapping("/me")
    public User updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                               @RequestBody UserProfileRequest request) {
        return userService.updateProfile(principal.getUserId(), request);
    }
}
