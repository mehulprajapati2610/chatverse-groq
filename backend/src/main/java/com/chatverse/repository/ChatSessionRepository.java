package com.chatverse.repository;

import com.chatverse.model.ChatSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ChatSessionRepository extends MongoRepository<ChatSession, String> {
    List<ChatSession> findByUserIdOrderByUpdatedAtDesc(String userId);
    Optional<ChatSession> findByIdAndUserId(String id, String userId);
    List<ChatSession> findByUserIdAndCharacterId(String userId, String characterId);
}
