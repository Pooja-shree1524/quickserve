package com.quickserve.config;

import com.quickserve.entity.Food;
import com.quickserve.repository.FoodRepository;
import com.quickserve.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/** Seeds a handful of menu items on first run so the app is demoable immediately. */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final FoodRepository foodRepository;
    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@quickserve.com")) {
            userRepository.save(com.quickserve.entity.User.builder()
                    .name("Admin")
                    .email("admin@quickserve.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(com.quickserve.entity.User.Role.ADMIN)
                    .isBlocked(false)
                    .build());
        }

        if (foodRepository.count() > 0) {
            return;
        }

        foodRepository.saveAll(java.util.List.of(
                Food.builder().name("Masala Dosa").description("Crispy rice crepe with spiced potato filling")
                        .price(new BigDecimal("60.00")).category("Breakfast").prepTimeMinutes(12).available(true).build(),
                Food.builder().name("Veg Sandwich").description("Grilled sandwich with fresh vegetables")
                        .price(new BigDecimal("40.00")).category("Snacks").prepTimeMinutes(6).available(true).build(),
                Food.builder().name("Paneer Butter Masala").description("Cottage cheese in creamy tomato gravy")
                        .price(new BigDecimal("120.00")).category("Lunch").prepTimeMinutes(15).available(true).build(),
                Food.builder().name("Veg Biryani").description("Fragrant rice cooked with mixed vegetables and spices")
                        .price(new BigDecimal("100.00")).category("Lunch").prepTimeMinutes(18).available(true).build(),
                Food.builder().name("Cold Coffee").description("Chilled coffee blended with milk and ice")
                        .price(new BigDecimal("35.00")).category("Beverages").prepTimeMinutes(4).available(true).build(),
                Food.builder().name("Samosa (2 pcs)").description("Crispy pastry filled with spiced potatoes")
                        .price(new BigDecimal("20.00")).category("Snacks").prepTimeMinutes(3).available(true).build(),
                Food.builder().name("Idli Sambar").description("Steamed rice cakes served with lentil soup")
                        .price(new BigDecimal("45.00")).category("Breakfast").prepTimeMinutes(8).available(true).build(),
                Food.builder().name("Fresh Lime Soda").description("Refreshing lime soda, sweet or salted")
                        .price(new BigDecimal("25.00")).category("Beverages").prepTimeMinutes(2).available(true).build()
        ));
    }
}
