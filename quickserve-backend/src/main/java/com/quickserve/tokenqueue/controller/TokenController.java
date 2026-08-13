package com.quickserve.tokenqueue.controller;

import com.quickserve.tokenqueue.dto.CurrentTokenResponse;
import com.quickserve.tokenqueue.dto.GenerateTokenRequest;
import com.quickserve.tokenqueue.dto.QueueResponse;
import com.quickserve.tokenqueue.dto.TokenResponse;
import com.quickserve.tokenqueue.dto.UpdateStatusRequest;
import com.quickserve.tokenqueue.service.AiPredictionClient;
import com.quickserve.tokenqueue.service.TokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Tag(name = "Token & Queue", description = "Smart Token & Queue Module — Member 3")
public class TokenController {

    private final TokenService tokenService;
    private final AiPredictionClient aiPredictionClient;

    public TokenController(TokenService tokenService, AiPredictionClient aiPredictionClient) {
        this.tokenService = tokenService;
        this.aiPredictionClient = aiPredictionClient;
    }

    @Operation(summary = "Generate a new digital token for an order (Feature 1)")
    @PostMapping("/generateToken")
    public ResponseEntity<TokenResponse> generateToken(@Valid @RequestBody GenerateTokenRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tokenService.generateToken(request));
    }

    @Operation(summary = "Get the AI-ranked live queue (Features 2 & 4)")
    @GetMapping("/queue")
    public ResponseEntity<QueueResponse> getQueue() {
        return ResponseEntity.ok(tokenService.getQueue());
    }

    @Operation(summary = "Advance a token's status (Feature 3): Waiting -> Preparing -> Ready -> Collected")
    @PutMapping("/updateStatus")
    public ResponseEntity<TokenResponse> updateStatus(@Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(tokenService.updateStatus(request.getTokenNumber(), request.getStatus()));
    }

    @Operation(summary = "Get the 'Now Serving' + up-next tokens for the live display board (Feature 4)")
    @GetMapping("/currentToken")
    public ResponseEntity<CurrentTokenResponse> getCurrentToken() {
        return ResponseEntity.ok(tokenService.getCurrentToken());
    }

    @Operation(summary = "Look up a single token by its token number (used to track one order)")
    @GetMapping("/token/{tokenNumber}")
    public ResponseEntity<TokenResponse> getToken(@PathVariable String tokenNumber) {
        return ResponseEntity.ok(tokenService.getByTokenNumber(tokenNumber));
    }

    @Operation(summary = "Get AI Crowd Prediction (Feature 2)")
    @GetMapping("/ai/predictCrowd")
    public ResponseEntity<Map<String, Object>> predictCrowd(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String time,
            @RequestParam(defaultValue = "0") int previousOrders) {
        return ResponseEntity.ok(aiPredictionClient.predictCrowd(date, time, previousOrders));
    }
}
