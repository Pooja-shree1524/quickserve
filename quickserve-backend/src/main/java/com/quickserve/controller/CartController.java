package com.quickserve.controller;

import com.quickserve.dto.CartItemRequest;
import com.quickserve.entity.Cart;
import com.quickserve.security.UserPrincipal;
import com.quickserve.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public Cart getCart(@AuthenticationPrincipal UserPrincipal principal) {
        return cartService.getCartForUser(principal.getUser());
    }

    @PostMapping
    public Cart addToCart(@AuthenticationPrincipal UserPrincipal principal,
                           @Valid @RequestBody CartItemRequest request) {
        return cartService.addToCart(principal.getUser(), request);
    }

    @PutMapping("/{cartItemId}")
    public Cart updateQuantity(@AuthenticationPrincipal UserPrincipal principal,
                                @PathVariable Long cartItemId,
                                @RequestParam int quantity) {
        return cartService.updateQuantity(principal.getUser(), cartItemId, quantity);
    }

    @DeleteMapping("/{cartItemId}")
    public Cart removeItem(@AuthenticationPrincipal UserPrincipal principal,
                            @PathVariable Long cartItemId) {
        return cartService.removeItem(principal.getUser(), cartItemId);
    }
}
