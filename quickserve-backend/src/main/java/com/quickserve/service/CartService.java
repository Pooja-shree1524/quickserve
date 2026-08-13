package com.quickserve.service;

import com.quickserve.dto.CartItemRequest;
import com.quickserve.entity.Cart;
import com.quickserve.entity.CartItem;
import com.quickserve.entity.Food;
import com.quickserve.entity.User;
import com.quickserve.exception.BadRequestException;
import com.quickserve.exception.ResourceNotFoundException;
import com.quickserve.repository.CartItemRepository;
import com.quickserve.repository.CartRepository;
import com.quickserve.repository.FoodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final FoodRepository foodRepository;

    public Cart getCartForUser(User user) {
        return cartRepository.findByUser(user)
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    public Cart addToCart(User user, CartItemRequest request) {
        Cart cart = getCartForUser(user);
        Food food = foodRepository.findById(request.getFoodId())
                .orElseThrow(() -> new ResourceNotFoundException("Food item not found"));

        if (Boolean.FALSE.equals(food.getAvailable())) {
            throw new BadRequestException("This item is currently unavailable");
        }

        CartItem existing = cart.getItems().stream()
                .filter(item -> item.getFood().getId().equals(food.getId()))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + request.getQuantity());
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .food(food)
                    .quantity(request.getQuantity())
                    .build();
            cart.getItems().add(newItem);
        }

        return cartRepository.save(cart);
    }

    public Cart updateQuantity(User user, Long cartItemId, int quantity) {
        Cart cart = getCartForUser(user);
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(cartItemId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (quantity <= 0) {
            cart.getItems().remove(item);
        } else {
            item.setQuantity(quantity);
        }

        return cartRepository.save(cart);
    }

    public Cart removeItem(User user, Long cartItemId) {
        Cart cart = getCartForUser(user);
        boolean removed = cart.getItems().removeIf(i -> i.getId().equals(cartItemId));
        if (!removed) {
            throw new ResourceNotFoundException("Cart item not found");
        }
        return cartRepository.save(cart);
    }

    public void clearCart(Cart cart) {
        cart.getItems().clear();
        cartRepository.save(cart);
    }

    public BigDecimal calculateTotal(Cart cart) {
        return cart.getItems().stream()
                .map(item -> item.getFood().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
