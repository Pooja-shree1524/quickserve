package com.quickserve.tokenqueue.repository;

import com.quickserve.tokenqueue.entity.Token;
import com.quickserve.tokenqueue.entity.TokenStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TokenRepository extends JpaRepository<Token, Long> {

    Optional<Token> findByTokenNumber(String tokenNumber);

    Optional<Token> findByOrderId(Long orderId);

    List<Token> findByStatusOrderByQueuePositionAsc(TokenStatus status);

    List<Token> findByStatusOrderByUpdatedAtAsc(TokenStatus status);

    List<Token> findByStatusOrderByUpdatedAtDesc(TokenStatus status);

    List<Token> findByStatusOrderByReadyAtDesc(TokenStatus status);

    long countByStatusIn(List<TokenStatus> statuses);
}
