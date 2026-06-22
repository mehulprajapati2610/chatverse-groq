# ChatVerse - Requirements

## Project Goal

Build an AI-powered web application that allows users to have conversations with fictional characters from different movies and TV series using the Groq LLM API.

The application should support both guest users and registered users while providing a fast and responsive chatting experience.

---

## Functional Requirements

### User Authentication

- User should be able to create an account.
- User should be able to log in securely.
- JWT should be used for authentication.
- Logged-in users should remain authenticated until logout or token expiration.

---

### Guest Chat

- Users should be able to chat without creating an account.
- Guest conversations should not be stored permanently.
- Guest mode should work immediately after opening the application.

---

### Character Management

- Display all available fictional characters.
- Allow searching characters by name.
- Allow filtering characters by universe.
- Show character details before starting a conversation.

---

### AI Conversation

- User selects a character.
- User sends a message.
- Backend sends the prompt to Groq API.
- AI responds while maintaining the selected character's personality.

---

### Chat History

Authenticated users should:

- View previous conversations.
- Continue existing chats.
- Delete old chat sessions.

Guest users should not have chat history.

---

## Non Functional Requirements

- Simple and responsive UI
- Fast API response
- Secure authentication
- Easy deployment
- Clean backend architecture
- Modular codebase
