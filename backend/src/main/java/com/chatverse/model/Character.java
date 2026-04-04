package com.chatverse.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "characters")
public class Character {

    @Id
    private String id;

    private String name;
    private String universe;
    private String icon;
    private String description;
    private String systemPrompt;
    private List<String> suggestions;
    private String tag;
    private String tagColor;
}
