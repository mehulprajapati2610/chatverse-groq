package com.chatverse.repository;

import com.chatverse.model.Character;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface CharacterRepository extends MongoRepository<Character, String> {
    List<Character> findByTag(String tag);
    List<Character> findByUniverse(String universe);
}
