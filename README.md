# 💬 ChatVerse (Groq Edition — 100% Free)

AI-powered chat app where you can talk to 40+ fictional characters from movies & web series.
Powered by **Groq** (free tier) using **Llama 3.3 70B** — no paid API needed!

---

## 🌟 Features

- **40+ Characters** — GOT, Harry Potter, Marvel, DC, Stranger Things, Avatar ATLA, Money Heist, Squid Game, Dark, Mirzapur, Sacred Games, Scam 1992, Panchayat, The Family Man, Wednesday, Breaking Bad, Peaky Blinders, The Witcher, Friends, LOTR, Prison Break, Sherlock, Narcos, Star Wars, Inception, Interstellar, Tenet & more
- **Guest Mode** — Chat instantly, no sign-up needed (history not saved)
- **Auth Mode** — Sign up/login to save full chat history in MongoDB
- **Character Dropdown + Search + Filter by Universe**
- **Suggestion Chips** per character
- **Persistent History** sidebar for logged-in users
- **Dark UI** — Clean, modern interface

---

## 🏗️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | HTML, CSS, Vanilla JS               |
| Backend   | Spring Boot 3 (Java 17)             |
| Database  | MongoDB                             |
| AI        | Groq API — Llama 3.3 70B (FREE)     |
| Auth      | JWT                                 |

---

## 🆓 Get Your FREE Groq API Key

1. Go to **https://console.groq.com**
2. Sign up (free, no credit card needed)
3. Go to **API Keys** → **Create API Key**
4. Copy the key — paste it in `application.properties`

**Free tier limits (very generous):**
- 14,400 requests/day
- 6,000 tokens/minute
- Completely free, no credit card required

---

## ⚙️ Setup Instructions

### Prerequisites
- Java 17+
- Maven 3.8+
- MongoDB running on localhost:27017
- Free Groq API key (see above)

---

### Step 1 — Start MongoDB

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

---

### Step 2 — Set Your Groq API Key

Open `backend/src/main/resources/application.properties`:

```properties
groq.api.key=gsk_YOUR_KEY_HERE
```

Optionally switch models:
```properties
groq.model=llama-3.3-70b-versatile   # best quality (default)
groq.model=llama-3.1-8b-instant      # faster, lighter
groq.model=mixtral-8x7b-32768        # long context
groq.model=gemma2-9b-it              # Google Gemma
```

---

### Step 3 — Run the Backend

```bash
cd backend
mvn spring-boot:run
```

Server starts at **http://localhost:8080**
On first run, all 40+ characters are auto-seeded into MongoDB:
```
✅ Seeded 40 characters into MongoDB.
```

---

### Step 4 — Open the Frontend

```bash
# Option A: VS Code Live Server (port 5500) — recommended
# Option B: Python server
cd frontend && python3 -m http.server 5500
# Then open http://localhost:5500

# Option C: Direct file open (add null to CORS origins first)
open frontend/index.html
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint           | Auth | Description      |
|--------|--------------------|------|------------------|
| POST   | /api/auth/signup   | ❌   | Register         |
| POST   | /api/auth/login    | ❌   | Login            |
| GET    | /api/auth/profile  | ✅   | Get profile      |

### Characters
| Method | Endpoint              | Auth | Description        |
|--------|-----------------------|------|--------------------|
| GET    | /api/characters       | ❌   | Get all characters |
| GET    | /api/characters/{id}  | ❌   | Get by ID          |

### Chat
| Method | Endpoint               | Auth | Description                   |
|--------|------------------------|------|-------------------------------|
| POST   | /api/chat/guest        | ❌   | Guest chat (no history saved) |
| POST   | /api/chat/send         | ✅   | User chat (history saved)     |
| GET    | /api/chat/history      | ✅   | All sessions                  |
| GET    | /api/chat/session/{id} | ✅   | Specific session              |
| DELETE | /api/chat/session/{id} | ✅   | Delete session                |

---

## 📁 Project Structure

```
chatverse/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/chatverse/
│       ├── ChatVerseApplication.java
│       ├── config/       JwtUtil, JwtFilter, SecurityConfig
│       ├── controller/   AuthController, CharacterController, ChatController
│       ├── model/        User, Character, ChatSession
│       ├── repository/   UserRepository, CharacterRepository, ChatSessionRepository
│       └── service/      GroqService, AuthService, ChatService, CharacterSeeder
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js
└── README.md
```

---

## ➕ Adding New Characters

In `CharacterSeeder.java`, add to the list:

```java
make(
  "unique-id",          // MongoDB document ID
  "Character Name",
  "Universe",
  "🎭",                 // emoji
  "Short description",
  "Tag/Category",
  "You are X from Y. Speak like this...",   // system prompt
  List.of("Starter question 1?", "Starter question 2?")
)
```

Then drop the `characters` collection in MongoDB and restart.

---

## 🔒 Security Notes

- Passwords hashed with BCrypt
- JWT tokens expire in 24h (configurable)
- In production, use environment variables:
  ```bash
  export GROQ_API_KEY=gsk_...
  ```
  ```properties
  groq.api.key=${GROQ_API_KEY}
  ```

---

Built with ❤️ — Spring Boot + MongoDB + Groq (Llama 3.3 70B) — 100% Free
