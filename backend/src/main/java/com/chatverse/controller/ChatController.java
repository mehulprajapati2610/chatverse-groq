package com.chatverse.controller;

import com.chatverse.model.ChatSession;
import com.chatverse.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    // Guest chat - no auth required, no history saved
    @PostMapping("/guest")
    public ResponseEntity<?> guestChat(@RequestBody Map<String, Object> body) {
        try {
            String characterId = (String) body.get("characterId");
            List<Map<String, String>> messages = (List<Map<String, String>>) body.get("messages");
            String moodPrompt = (String) body.getOrDefault("moodPrompt", "");
            String scenarioContext = (String) body.getOrDefault("scenarioContext", "");
            String reply = chatService.guestChat(characterId, messages, moodPrompt, scenarioContext);
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Authenticated chat - history saved
    @PostMapping("/send")
    public ResponseEntity<?> userChat(@RequestBody Map<String, String> body, Authentication auth) {
        try {
            String characterId = body.get("characterId");
            String sessionId = body.get("sessionId");
            String message = body.get("message");
            String moodPrompt = body.getOrDefault("moodPrompt", "");
            String scenarioContext = body.getOrDefault("scenarioContext", "");
            Map<String, Object> result = chatService.userChat(
                    auth.getName(), characterId, sessionId, message, moodPrompt, scenarioContext
            );
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Get all chat sessions for logged-in user
    @GetMapping("/history")
    public ResponseEntity<List<ChatSession>> getHistory(Authentication auth) {
        return ResponseEntity.ok(chatService.getUserHistory(auth.getName()));
    }

    // Get specific session
    @GetMapping("/session/{id}")
    public ResponseEntity<?> getSession(@PathVariable String id, Authentication auth) {
        try {
            return ResponseEntity.ok(chatService.getSession(id, auth.getName()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Delete a session
    @DeleteMapping("/session/{id}")
    public ResponseEntity<?> deleteSession(@PathVariable String id, Authentication auth) {
        try {
            chatService.deleteSession(id, auth.getName());
            return ResponseEntity.ok(Map.of("message", "Session deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}