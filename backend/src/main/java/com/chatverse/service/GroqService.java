package com.chatverse.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.model}")
    private String model;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String BREVITY_PREFIX =
            "IMPORTANT RULES — follow these strictly:\n" +
                    "1. Reply in 2-4 SHORT sentences. Never write long walls of text.\n" +
                    "2. Sound exactly like the character — casual, punchy, in-character.\n" +
                    "3. Do NOT greet, summarise or repeat what the user said.\n" +
                    "4. Do NOT ask multiple questions — at most ONE follow-up.\n" +
                    "5. Stay 100% in character at all times. Never break the fourth wall.\n" +
                    "6. Match the user's language — if they write in Hindi reply in Hindi.\n\n";

    /**
     * Standard chat — used for normal single-character conversations.
     * moodPrompt: optional mood modifier (e.g. "You are drunk and loose")
     * scenarioContext: optional scenario/battle context to append to system prompt
     */
    public String chat(String systemPrompt,
                       List<Map<String, String>> userMessages,
                       String moodPrompt,
                       String scenarioContext) {
        try {
            StringBuilder fullPrompt = new StringBuilder(BREVITY_PREFIX);
            fullPrompt.append(systemPrompt);

            if (moodPrompt != null && !moodPrompt.isBlank()) {
                fullPrompt.append("\n\nMOOD OVERRIDE: ").append(moodPrompt);
            }
            if (scenarioContext != null && !scenarioContext.isBlank()) {
                fullPrompt.append("\n\nSCENARIO/CONTEXT: ").append(scenarioContext);
            }

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", fullPrompt.toString()));
            messages.addAll(userMessages);

            Map<String, Object> body = Map.of(
                    "model", model,
                    "messages", messages,
                    "max_tokens", 220,
                    "temperature", 1.1
            );

            String requestBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Groq API error " + response.statusCode()
                        + ": " + response.body());
            }

            Map<String, Object> responseMap =
                    objectMapper.readValue(response.body(), Map.class);

            List<Map<String, Object>> choices =
                    (List<Map<String, Object>>) responseMap.get("choices");

            if (choices == null || choices.isEmpty()) {
                throw new RuntimeException("Empty response from Groq API");
            }

            Map<String, Object> message =
                    (Map<String, Object>) choices.get(0).get("message");

            return (String) message.get("content");

        } catch (Exception e) {
            throw new RuntimeException("Failed to call Groq API: " + e.getMessage(), e);
        }
    }

    // Overload for backward compat — no mood/scenario
    public String chat(String systemPrompt, List<Map<String, String>> userMessages) {
        return chat(systemPrompt, userMessages, null, null);
    }
}