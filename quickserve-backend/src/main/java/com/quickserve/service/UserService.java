package com.quickserve.service;

import com.quickserve.dto.UserProfileRequest;
import com.quickserve.entity.User;
import com.quickserve.exception.ResourceNotFoundException;
import com.quickserve.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public User updateProfile(Long id, UserProfileRequest request) {
        User user = getById(id);
        if (request.getName() != null && !request.getName().isBlank()) {
            user.setName(request.getName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        return userRepository.save(user);
    }
}
