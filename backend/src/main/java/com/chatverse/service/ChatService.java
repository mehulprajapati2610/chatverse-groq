package com.chatverse.service;

import com.chatverse.model.Character;
import com.chatverse.model.ChatSession;
import com.chatverse.repository.CharacterRepository;
import com.chatverse.repository.ChatSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private GroqService groqService;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private CharacterRepository characterRepository;

    // Guest chat - no history saved
    public String guestChat(String characterId,
                            List<Map<String, String>> messages,
                            String moodPrompt,
                            String scenarioContext) {
        Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new RuntimeException("Character not found"));

        return groqService.chat(character.getSystemPrompt(), messages, moodPrompt, scenarioContext);
    }

    // Authenticated chat - history saved to MongoDB
    public Map<String, Object> userChat(String userId,
                                        String characterId,
                                        String sessionId,
                                        String userMessage,
                                        String moodPrompt,
                                        String scenarioContext) {
        Character character = characterRepository.findById(characterId)
                .orElseThrow(() -> new RuntimeException("Character not found"));

        ChatSession session;

        if (sessionId != null && !sessionId.isEmpty()) {
            session = chatSessionRepository.findByIdAndUserId(sessionId, userId)
                    .orElseGet(() -> createNewSession(userId, character));
        } else {
            session = createNewSession(userId, character);
        }

        // Add user message
        ChatSession.Message userMsg = new ChatSession.Message("user", userMessage, LocalDateTime.now());
        session.getMessages().add(userMsg);

        // Build messages list for API
        List<Map<String, String>> apiMessages = session.getMessages().stream()
                .map(m -> Map.of("role", m.getRole(), "content", m.getContent()))
                .collect(Collectors.toList());

        // Call Groq with mood and scenario
        String reply = groqService.chat(character.getSystemPrompt(), apiMessages, moodPrompt, scenarioContext);

        // Save assistant reply
        ChatSession.Message assistantMsg = new ChatSession.Message("assistant", reply, LocalDateTime.now());
        session.getMessages().add(assistantMsg);
        session.setUpdatedAt(LocalDateTime.now());

        ChatSession saved = chatSessionRepository.save(session);

        return Map.of(
                "reply", reply,
                "sessionId", saved.getId()
        );
    }

    private ChatSession createNewSession(String userId, Character character) {
        ChatSession session = new ChatSession();
        session.setUserId(userId);
        session.setCharacterId(character.getId());
        session.setCharacterName(character.getName());
        session.setUniverse(character.getUniverse());
        session.setMessages(new ArrayList<>());
        return session;
    }

    public List<ChatSession> getUserHistory(String userId) {
        return chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    public ChatSession getSession(String sessionId, String userId) {
        return chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    public void deleteSession(String sessionId, String userId) {
        ChatSession session = chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        chatSessionRepository.delete(session);
    }
}