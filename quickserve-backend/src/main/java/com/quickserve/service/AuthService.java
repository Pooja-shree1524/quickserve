package com.quickserve.service;

import com.quickserve.dto.ApiResponse;
import com.quickserve.dto.AuthResponse;
import com.quickserve.dto.LoginRequest;
import com.quickserve.dto.RegisterRequest;
import com.quickserve.entity.Cart;
import com.quickserve.entity.User;
import com.quickserve.exception.BadRequestException;
import com.quickserve.repository.CartRepository;
import com.quickserve.repository.UserRepository;
import com.quickserve.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email already exists");
        }

        String verificationToken = UUID.randomUUID().toString();
        LocalDateTime tokenExpiry = LocalDateTime.now().plusHours(24);

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(User.Role.CUSTOMER)
                .emailVerified(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiry(tokenExpiry)
                .build();

        user = userRepository.save(user);

        // Every new customer gets an empty cart ready to use
        Cart cart = Cart.builder().user(user).build();
        cartRepository.save(cart);

        log.info("Registration successful for user id={}", user.getId());
        log.info("Verification token generated");

        // Send verification email — non-fatal: account is already created regardless
        boolean emailSent = true;
        String emailMessage = "A verification link has been sent to your email. Please verify before logging in.";
        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getName(), verificationToken);
        } catch (Exception e) {
            emailSent = false;
            emailMessage = "Account created, but the verification email could not be sent. Use 'Resend verification' on the login page to try again.";
            log.error("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage(), e);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .emailSent(emailSent)
                .message(emailMessage)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        // Admins are pre-created accounts — skip email verification gate
        if (user.getRole() == User.Role.CUSTOMER && !Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BadRequestException("Please verify your email before logging in.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public ApiResponse verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Verification token is required.");
        }

        User user = userRepository.findByVerificationToken(token.trim())
                .orElseThrow(() -> new BadRequestException("This verification link is invalid, already used, or the account has been deleted."));

        if (user.getVerificationTokenExpiry() != null && user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Verification token has expired. Please request a new verification email.");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        return ApiResponse.builder()
                .success(true)
                .message("Email verified successfully. You can now log in.")
                .build();
    }

    @Transactional
    public ApiResponse resendVerification(String email) {
        String genericMessage = "If a registered, unverified account matches that email, a new verification link has been sent. Please check your inbox and spam folder.";

        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            log.warn("Resend verification requested for non-existent email: {}", email);
            return ApiResponse.builder()
                    .success(true)
                    .message(genericMessage)
                    .build();
        }

        User user = userOpt.get();

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            log.info("Resend verification requested for already verified email: {}", email);
            return ApiResponse.builder()
                    .success(true)
                    .message(genericMessage)
                    .build();
        }

        String newToken = UUID.randomUUID().toString();
        LocalDateTime newExpiry = LocalDateTime.now().plusHours(24);

        user.setVerificationToken(newToken);
        user.setVerificationTokenExpiry(newExpiry);
        userRepository.save(user);

        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getName(), newToken);
        } catch (Exception e) {
            log.error("Failed to resend verification email to {}: {}", user.getEmail(), e.getMessage(), e);
            throw new BadRequestException("We couldn't send the verification email right now. Please try again later.");
        }

        return ApiResponse.builder()
                .success(true)
                .message(genericMessage)
                .build();
    }
}
