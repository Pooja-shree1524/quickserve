package com.quickserve.admin.service;

import com.quickserve.admin.dto.UserResponse;
import com.quickserve.entity.User;
import com.quickserve.exception.ResourceNotFoundException;
import com.quickserve.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;

    public List<UserResponse> getAllCustomers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.CUSTOMER)
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public UserResponse setBlocked(Long userId, boolean blocked) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        user.setIsBlocked(blocked);
        return toResponse(userRepository.save(user));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .blocked(Boolean.TRUE.equals(user.getIsBlocked()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}
