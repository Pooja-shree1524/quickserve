package com.quickserve.service;

import com.quickserve.dto.UserProfileRequest;
import com.quickserve.entity.Orders;
import com.quickserve.entity.User;
import com.quickserve.exception.ResourceNotFoundException;
import com.quickserve.repository.CartRepository;
import com.quickserve.repository.OrdersRepository;
import com.quickserve.repository.PaymentRepository;
import com.quickserve.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final OrdersRepository ordersRepository;
    private final PaymentRepository paymentRepository;

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

    @Transactional
    public void deleteAccount(Long id) {
        User user = getById(id);

        // 1. Find all orders for this user
        List<Orders> orders = ordersRepository.findByUserOrderByCreatedAtDesc(user);

        // 2. Delete payments first (FK → orders)
        if (!orders.isEmpty()) {
            paymentRepository.deleteByOrderIn(orders);
        }

        // 3. Delete orders (cascades to order_items via CascadeType.ALL)
        ordersRepository.deleteAll(orders);

        // 4. Delete cart (cascades to cart_items via CascadeType.ALL)
        cartRepository.findByUser(user).ifPresent(cartRepository::delete);

        // 5. Finally delete the user
        userRepository.delete(user);
    }
}

