package com.quickserve.service;

import com.quickserve.dto.PlaceOrderRequest;
import com.quickserve.entity.*;
import com.quickserve.exception.BadRequestException;
import com.quickserve.exception.ResourceNotFoundException;
import com.quickserve.repository.OrdersRepository;
import com.quickserve.tokenqueue.entity.Token;
import com.quickserve.tokenqueue.service.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrdersRepository ordersRepository;
    private final CartService cartService;
    private final AiPredictionService aiPredictionService;
    private final PaymentService paymentService;
    private final TokenService tokenService;

    @Transactional
    public Orders placeOrder(User user, PlaceOrderRequest request) {
        Cart cart = cartService.getCartForUser(user);

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Your cart is empty");
        }

        BigDecimal total = cartService.calculateTotal(cart);

        Orders order = Orders.builder()
                .user(user)
                .totalAmount(total)
                .status(Orders.OrderStatus.PLACED)
                .pickupTime(request.getPickupTime())
                .token("T" + (100 + (System.currentTimeMillis() % 90000)))
                .build();

        for (CartItem cartItem : cart.getItems()) {
            BigDecimal price = cartItem.getFood().getPrice();
            int qty = cartItem.getQuantity();
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .food(cartItem.getFood())
                    .foodNameSnapshot(cartItem.getFood().getName())
                    .priceSnapshot(price)
                    .quantity(qty)
                    .lineTotal(price.multiply(BigDecimal.valueOf(qty)))
                    .build();
            order.getItems().add(orderItem);
        }

        order = ordersRepository.save(order);

        // Process payment (dummy or Razorpay)
        Payment payment = paymentService.processPayment(order, request.getPaymentMethod());

        // Token generated ONLY after successful payment
        if (payment.getStatus() == Payment.PaymentStatus.SUCCESS) {
            Token token = tokenService.generateTokenForOrder(order);
            order.setToken(token.getTokenNumber());
            order.setEstimatedWaitMinutes(token.getEstimatedPrepTime());
            order = ordersRepository.save(order);

            // Order placed & paid - clear the cart
            cartService.clearCart(cart);
        }

        return order;
    }

    public List<Orders> getOrderHistory(User user) {
        return ordersRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public Orders getOrderForUser(User user, Long orderId) {
        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("This order does not belong to you");
        }
        return order;
    }

    public Orders trackOrder(Long orderId) {
        return ordersRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
    }

    @Transactional
    public Orders updateStatus(Long orderId, Orders.OrderStatus status) {
        Orders order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        order.setStatus(status);
        order.setUpdatedAt(LocalDateTime.now());
        return ordersRepository.save(order);
    }
}
