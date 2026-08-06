package com.quickserve.tokenqueue.service;

import com.quickserve.tokenqueue.dto.CurrentTokenResponse;
import com.quickserve.tokenqueue.dto.GenerateTokenRequest;
import com.quickserve.tokenqueue.dto.OrderItemDto;
import com.quickserve.tokenqueue.dto.QueueResponse;
import com.quickserve.tokenqueue.dto.TokenResponse;
import com.quickserve.tokenqueue.entity.Token;
import com.quickserve.tokenqueue.entity.TokenStatus;
import com.quickserve.tokenqueue.exception.InvalidStatusTransitionException;
import com.quickserve.tokenqueue.exception.TokenNotFoundException;
import com.quickserve.tokenqueue.repository.TokenRepository;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TokenService {

    private final TokenRepository tokenRepository;
    private final QueueAlgorithmService queueAlgorithmService;

    // Only these forward transitions are allowed
    private static final Map<TokenStatus, TokenStatus> NEXT_STATUS = new EnumMap<>(TokenStatus.class);
    static {
        NEXT_STATUS.put(TokenStatus.Waiting, TokenStatus.Preparing);
        NEXT_STATUS.put(TokenStatus.Preparing, TokenStatus.Ready);
        NEXT_STATUS.put(TokenStatus.Ready, TokenStatus.Collected);
    }

    public TokenService(TokenRepository tokenRepository, QueueAlgorithmService queueAlgorithmService) {
        this.tokenRepository = tokenRepository;
        this.queueAlgorithmService = queueAlgorithmService;
    }

    /** Feature 1: Digital Token Generation. */
    @Transactional
    public TokenResponse generateToken(GenerateTokenRequest request) {
        List<OrderItemDto> items = request.getItems();
        long kitchenLoad = queueAlgorithmService.getKitchenLoad();

        Token token = new Token();
        token.setCustomerName(request.getCustomerName());
        token.setItems(items.stream().map(QueueAlgorithmService::toEntity).collect(Collectors.toList()));
        token.setTotalComplexity(queueAlgorithmService.sumComplexity(items));
        token.setEstimatedPrepTime(queueAlgorithmService.resolvePrepTime(items, kitchenLoad));
        token.setStatus(TokenStatus.Waiting);

        // Save once to get the DB-generated id, then derive a human-friendly
        // sequential token number from it (e.g. id=1 -> "A101").
        Token saved = tokenRepository.save(token);
        saved.setTokenNumber("A" + (100 + saved.getId()));
        saved = tokenRepository.save(saved);

        queueAlgorithmService.recalculateQueue();
        return TokenResponse.from(tokenRepository.findById(saved.getId()).orElseThrow());
    }

    /** Feature 2 & 4: Smart Queue / Live Queue Display. */
    @Transactional(readOnly = true)
    public QueueResponse getQueue() {
        long kitchenLoad = queueAlgorithmService.getKitchenLoad();
        List<TokenResponse> waiting = tokenRepository
                .findByStatusOrderByQueuePositionAsc(TokenStatus.Waiting)
                .stream().map(TokenResponse::from).collect(Collectors.toList());
        List<TokenResponse> preparing = tokenRepository
                .findByStatusOrderByUpdatedAtAsc(TokenStatus.Preparing)
                .stream().map(TokenResponse::from).collect(Collectors.toList());
        return new QueueResponse(kitchenLoad, preparing, waiting);
    }

    /** Feature 3: Token Status transitions (Waiting -> Preparing -> Ready -> Collected). */
    @Transactional
    public TokenResponse updateStatus(String tokenNumber, TokenStatus newStatus) {
        Token token = tokenRepository.findByTokenNumber(tokenNumber)
                .orElseThrow(() -> new TokenNotFoundException(tokenNumber));

        TokenStatus allowedNext = NEXT_STATUS.get(token.getStatus());
        if (allowedNext == null || allowedNext != newStatus) {
            throw new InvalidStatusTransitionException(token.getStatus().name(), newStatus.name());
        }

        token.setStatus(newStatus);
        if (newStatus == TokenStatus.Ready) {
            token.setReadyAt(LocalDateTime.now());
        }
        if (newStatus == TokenStatus.Collected) {
            token.setCollectedAt(LocalDateTime.now());
        }
        if (newStatus == TokenStatus.Preparing) {
            token.setQueuePosition(null); // leaves the waiting queue
        }

        Token saved = tokenRepository.save(token);
        queueAlgorithmService.recalculateQueue();

        // Feature 5 hook: the caller (controller) reports whether this change
        // should trigger a "ready" notification. The frontend also polls and
        // reacts to status === Ready independently.
        return TokenResponse.from(saved);
    }

    /** Feature 4: "Now Serving" board data. */
    @Transactional(readOnly = true)
    public CurrentTokenResponse getCurrentToken() {
        Token current = tokenRepository.findByStatusOrderByUpdatedAtDesc(TokenStatus.Preparing)
                .stream().findFirst()
                .or(() -> tokenRepository.findByStatusOrderByReadyAtDesc(TokenStatus.Ready).stream().findFirst())
                .orElse(null);

        List<String> next = tokenRepository.findByStatusOrderByQueuePositionAsc(TokenStatus.Waiting)
                .stream().limit(3).map(Token::getTokenNumber).collect(Collectors.toList());

        return new CurrentTokenResponse(
                current != null ? current.getTokenNumber() : null,
                current != null ? current.getStatus() : null,
                next);
    }

    @Transactional(readOnly = true)
    public TokenResponse getByTokenNumber(String tokenNumber) {
        Token token = tokenRepository.findByTokenNumber(tokenNumber)
                .orElseThrow(() -> new TokenNotFoundException(tokenNumber));
        return TokenResponse.from(token);
    }
}
