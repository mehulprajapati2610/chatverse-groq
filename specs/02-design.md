# ChatVerse - Design

## System Overview

The project follows a client-server architecture.

Frontend communicates with the Spring Boot backend using REST APIs.

The backend communicates with:

- MongoDB
- Groq API

---

## High Level Flow

User

↓

Frontend (HTML/CSS/JavaScript)

↓

Spring Boot REST API

↓

Business Logic

↓

MongoDB + Groq API

↓

Frontend Response

---

## Main Modules

### Authentication

Responsible for:

- Signup
- Login
- JWT generation
- JWT validation

---

### Character Module

Responsible for:

- Loading characters
- Searching characters
- Returning character information

---

### Chat Module

Responsible for:

- Receiving user messages
- Preparing AI prompt
- Calling Groq API
- Returning AI response
- Saving history for authenticated users

---

### Database

MongoDB stores:

- Users
- Characters
- Chat Sessions
- Messages

---

## Security

- JWT Authentication
- Protected chat history endpoints
- Password hashing using BCrypt

---

## Design Considerations

- Separation of concerns
- Stateless authentication
- RESTful APIs
- Reusable service layer
- Easy addition of new characters
