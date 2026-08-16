package com.quickserve.tokenqueue.service;

import com.quickserve.entity.Orders;

import com.quickserve.repository.OrdersRepository;
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
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TokenService {

    private final TokenRepository tokenRepository;
    private final QueueAlgorithmService queueAlgorithmService;
    private final OrdersRepository ordersRepository;

    // Only these forward transitions are allowed
    private static final Map<TokenStatus, TokenStatus> NEXT_STATUS = new EnumMap<>(TokenStatus.class);
    static {
        NEXT_STATUS.put(TokenStatus.Waiting, TokenStatus.Preparing);
        NEXT_STATUS.put(TokenStatus.Preparing, TokenStatus.Ready);
        NEXT_STATUS.put(TokenStatus.Ready, TokenStatus.Collected);
    }

    public TokenService(
            TokenRepository tokenRepository,
            QueueAlgorithmService queueAlgorithmService,
            @Lazy OrdersRepository ordersRepository) {
        this.tokenRepository = tokenRepository;
        this.queueAlgorithmService = queueAlgorithmService;
        this.ordersRepository = ordersRepository;
    }

    /** Feature 1: Digital Token Generation (Standalone). */
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
        token.setTokenNumber("T" + (100 + (System.currentTimeMillis() % 90000)));

        Token saved = tokenRepository.save(token);
        saved.setTokenNumber("A" + (100 + saved.getId()));
        saved = tokenRepository.save(saved);

        queueAlgorithmService.recalculateQueue();
        return TokenResponse.from(tokenRepository.findById(saved.getId()).orElseThrow());
    }

    /** Integration Point: Generate Token AFTER successful payment for an existing Order. */
    @Transactional
    public Token generateTokenForOrder(Orders order) {
        long kitchenLoad = queueAlgorithmService.getKitchenLoad();

        List<OrderItemDto> itemDtos = new ArrayList<>();
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (com.quickserve.entity.OrderItem item : order.getItems()) {
                OrderItemDto dto = new OrderItemDto();
                dto.setName(item.getFoodNameSnapshot() != null ? item.getFoodNameSnapshot() : "Item");
                int complexity = 2;
                if (item.getFood() != null && item.getFood().getPrepTimeMinutes() != null) {
                    int prep = item.getFood().getPrepTimeMinutes();
                    complexity = (prep <= 5) ? 1 : (prep <= 12) ? 2 : 3;
                }
                dto.setComplexity(complexity);
                itemDtos.add(dto);
            }
        } else {
            OrderItemDto dto = new OrderItemDto();
            dto.setName("Order #" + order.getId());
            dto.setComplexity(2);
            itemDtos.add(dto);
        }

        Token token = new Token();
        token.setOrderId(order.getId());
        token.setCustomerName(order.getUser() != null ? order.getUser().getName() : "Customer");
        token.setItems(itemDtos.stream().map(QueueAlgorithmService::toEntity).collect(Collectors.toList()));
        token.setTotalComplexity(queueAlgorithmService.sumComplexity(itemDtos));
        token.setEstimatedPrepTime(queueAlgorithmService.resolvePrepTime(itemDtos, kitchenLoad));
        token.setStatus(TokenStatus.Waiting);
        token.setTokenNumber("T" + (100 + (System.currentTimeMillis() % 90000)));

        Token saved = tokenRepository.save(token);
        saved.setTokenNumber("A" + (100 + saved.getId()));
        saved = tokenRepository.save(saved);

        queueAlgorithmService.recalculateQueue();
        return tokenRepository.findById(saved.getId()).orElse(saved);
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

    /** Feature 3: Token Status transitions + Order Status synchronization. */
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

        // Synchronize OrderStatus in Orders table
        syncOrderStatus(saved);

        return TokenResponse.from(saved);
    }

    /** Direct status update without strict step enforcement (used by Admin/OrderService synchronization). */
    @Transactional
    public Token forceUpdateStatus(String tokenNumber, TokenStatus newStatus) {
        Optional<Token> tokenOpt = tokenRepository.findByTokenNumber(tokenNumber);
        if (tokenOpt.isEmpty()) return null;

        Token token = tokenOpt.get();
        if (token.getStatus() == newStatus) {
            return token;
        }

        token.setStatus(newStatus);
        if (newStatus == TokenStatus.Ready) {
            token.setReadyAt(LocalDateTime.now());
        }
        if (newStatus == TokenStatus.Collected) {
            token.setCollectedAt(LocalDateTime.now());
            token.setQueuePosition(null);
        }
        if (newStatus == TokenStatus.Preparing) {
            token.setQueuePosition(null);
        }

        Token saved = tokenRepository.save(token);
        queueAlgorithmService.recalculateQueue();
        return saved;
    }

    @Transactional
    public void cancelToken(String tokenNumber) {
        Optional<Token> tokenOpt = tokenRepository.findByTokenNumber(tokenNumber);
        if (tokenOpt.isPresent()) {
            Token token = tokenOpt.get();
            token.setStatus(TokenStatus.Collected);
            token.setQueuePosition(null);
            tokenRepository.save(token);
            queueAlgorithmService.recalculateQueue();
        }
    }

    private void syncOrderStatus(Token token) {
        if (token.getOrderId() == null && token.getTokenNumber() == null) return;

        Optional<Orders> orderOpt = Optional.empty();
        if (token.getOrderId() != null) {
            orderOpt = ordersRepository.findById(token.getOrderId());
        }
        if (orderOpt.isEmpty() && token.getTokenNumber() != null) {
            orderOpt = ordersRepository.findByToken(token.getTokenNumber());
        }

        if (orderOpt.isPresent()) {
            Orders order = orderOpt.get();
            switch (token.getStatus()) {
                case Waiting:
                    order.setStatus(Orders.OrderStatus.ACCEPTED);
                    break;
                case Preparing:
                    order.setStatus(Orders.OrderStatus.PREPARING);
                    break;
                case Ready:
                    order.setStatus(Orders.OrderStatus.READY);
                    break;
                case Collected:
                    order.setStatus(Orders.OrderStatus.COLLECTED);
                    break;
            }
            order.setUpdatedAt(LocalDateTime.now());
            ordersRepository.save(order);
        }
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
