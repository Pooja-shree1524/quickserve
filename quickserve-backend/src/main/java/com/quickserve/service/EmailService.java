package com.quickserve.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@quickserve.com}")
    private String fromEmail;

    @Value("${app.mail.verification-url:http://localhost:5173/verify-email}")
    private String verificationUrl;

    /**
     * Sends a verification email containing the token link to the user.
     * Throws an exception if sending fails, allowing the caller to handle it
     * without exposing internal mail server credentials or system details.
     */
    public void sendVerificationEmail(String toEmail, String name, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Verify your QuickServe email address");

            String link = verificationUrl + "?token=" + token;
            String recipientName = (name != null && !name.isBlank()) ? name : "Customer";

            String html = """
                    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
                        <h2 style="color: #0f172a; margin-bottom: 8px;">Welcome to QuickServe, %s!</h2>
                        <p style="color: #475569; font-size: 15px; line-height: 1.5;">
                            Thank you for registering. Please verify your email address to activate your account and start placing orders.
                        </p>
                        <div style="margin: 28px 0; text-align: center;">
                            <a href="%s" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-weight: 600; text-decoration: none; display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p style="color: #64748b; font-size: 13px;">
                            Or paste this link into your browser: <br/>
                            <a href="%s" style="color: #2563eb; word-break: break-all;">%s</a>
                        </p>
                        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
                            This verification link will expire in 24 hours. If you did not create an account, you can safely ignore this email.
                        </p>
                    </div>
                    """.formatted(recipientName, link, link, link);

            helper.setText(html, true);
            log.info("Attempting to send verification email to {}", toEmail);
            mailSender.send(message);
            log.info("Verification email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Could not send verification email: " + e.getMessage(), e);
        }
    }
}
