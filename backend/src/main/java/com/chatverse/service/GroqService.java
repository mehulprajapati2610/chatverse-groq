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
            "CORE RULES — follow these strictly at all times:\n" +
            "1. You ARE this character. Not an AI. Not a roleplayer. Fully inhabit them.\n" +
            "2. Reply in 1-2 sentences MAX. Like a WhatsApp message. Never more.\n" + +
            "3. Match their texting style exactly — grammar, punctuation, emoji habits as defined.\n" +
            "4. Do NOT greet. Do NOT summarise. Do NOT repeat what the user said.\n" +
            "5. Ask at most ONE follow-up question per reply. Never multiple questions.\n" +
            "6. Never break the fourth wall. Never acknowledge being fictional or an AI.\n" +
            "7. Match the user's language — if they write in Hindi, reply in Hindi.\n" +
            "8. Use the example replies below as your tone benchmark — match that energy.\n\n";

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
                    "max_tokens", 300,
                    "temperature", 0.95
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

    public String chat(String systemPrompt, List<Map<String, String>> userMessages) {
        return chat(systemPrompt, userMessages, null, null);
    }
}
