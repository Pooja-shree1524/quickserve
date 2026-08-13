package com.quickserve.tokenqueue.service;

import com.quickserve.tokenqueue.dto.OrderItemDto;
import com.quickserve.tokenqueue.entity.OrderItem;
import com.quickserve.tokenqueue.entity.Token;
import com.quickserve.tokenqueue.entity.TokenStatus;
import com.quickserve.tokenqueue.repository.TokenRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * ─────────────────────────────────────────────────────────────
 *  QUICKSERVE SMART QUEUE ALGORITHM
 * ─────────────────────────────────────────────────────────────
 * Decides the SERVING ORDER of tokens — which is NOT the same as
 * the order they were generated in (A101, A102, A103...).
 *
 * Inputs it weighs (matches the project brief exactly):
 *   1. Kitchen Load    -> how many orders are already active
 *   2. Preparation Time -> how long this order will take to cook
 *   3. Current Queue    -> how long this customer has already waited
 *   4. Order Complexity -> how many "difficult" items are in the order
 *
 * Rule of thumb: quicker/simpler orders are pushed forward when the
 * kitchen is busy (Shortest-Job-Next style scheduling), but an AGING
 * term guarantees a complex order is never starved behind an endless
 * stream of simple ones — the longer a customer waits, the more their
 * priority improves.
 *
 * LOWER priorityScore = served SOONER.
 * ─────────────────────────────────────────────────────────────
 */
@Service
public class QueueAlgorithmService {

    private final TokenRepository tokenRepository;
    private final AiPredictionClient aiPredictionClient;

    // Tunable weights — adjust to change how "aggressive" the algorithm is
    private static final double W_PREP_TIME = 1.5;
    private static final double W_COMPLEXITY = 2.0;
    private static final double W_KITCHEN_LOAD = 0.5;
    private static final double W_AGING = 3.0; // per minute waited

    private static final Map<Integer, Integer> COMPLEXITY_MINUTES = Map.of(1, 4, 2, 8, 3, 13);
    private static final int BASE_PREP_MINUTES = 2;

    public QueueAlgorithmService(TokenRepository tokenRepository, AiPredictionClient aiPredictionClient) {
        this.tokenRepository = tokenRepository;
        this.aiPredictionClient = aiPredictionClient;
    }

    /** Sum of each item's complexity score. */
    public int sumComplexity(List<OrderItemDto> items) {
        return items.stream().mapToInt(OrderItemDto::getComplexity).sum();
    }

    /**
     * Local (fallback) prep-time estimate. If Member 2's FastAPI AI
     * Prediction Module is reachable, its prediction is preferred —
     * see AiPredictionClient.
     */
    public int estimatePrepTimeLocally(List<OrderItemDto> items) {
        int itemsTime = items.stream()
                .mapToInt(i -> COMPLEXITY_MINUTES.getOrDefault(i.getComplexity(), 8))
                .sum();
        return BASE_PREP_MINUTES + itemsTime;
    }

    /**
     * Prep time used for a new token: tries the AI service first (Member 2),
     * falls back to the local heuristic above if it's unavailable.
     */
    public int resolvePrepTime(List<OrderItemDto> items, long kitchenLoad) {
        return aiPredictionClient
                .predictPrepTimeMinutes(items, kitchenLoad)
                .orElseGet(() -> estimatePrepTimeLocally(items));
    }

    /** How many orders are currently occupying the kitchen's attention. */
    public long getKitchenLoad() {
        return tokenRepository.countByStatusIn(List.of(TokenStatus.Waiting, TokenStatus.Preparing));
    }

    /** Core scoring function used to rank every waiting token. */
    public double calculatePriorityScore(Token token, long kitchenLoad) {
        double waitingMinutes = Duration.between(token.getCreatedAt(), LocalDateTime.now()).toSeconds() / 60.0;

        double score = token.getEstimatedPrepTime() * W_PREP_TIME
                + token.getTotalComplexity() * W_COMPLEXITY
                + kitchenLoad * W_KITCHEN_LOAD * (token.getTotalComplexity() / 3.0)
                - waitingMinutes * W_AGING;

        return Math.round(score * 100.0) / 100.0;
    }

    /**
     * Recalculates priority + queue position for every order still Waiting.
     * Call this after any token is created or any status changes.
     */
    public void recalculateQueue() {
        long kitchenLoad = getKitchenLoad();
        List<Token> waiting = tokenRepository.findByStatusOrderByQueuePositionAsc(TokenStatus.Waiting);

        waiting.sort(Comparator.comparingDouble(t -> calculatePriorityScore(t, kitchenLoad)));

        int position = 1;
        for (Token t : waiting) {
            t.setPriorityScore(calculatePriorityScore(t, kitchenLoad));
            t.setQueuePosition(position++);
        }
        tokenRepository.saveAll(waiting);
    }

    public static OrderItem toEntity(OrderItemDto dto) {
        return new OrderItem(dto.getName(), dto.getComplexity());
    }
}
