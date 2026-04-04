// ── Config ──────────────────────────────────────────────────
const API = 'https://oozy-writerly-blake.ngrok-free.dev/api';
// ── Moods ────────────────────────────────────────────────────
const MOODS = [
  { id: 'default', label: '😐 Normal',   prompt: '' },
  { id: 'happy',   label: '😄 Happy',    prompt: 'You are in a great mood — warm, playful, and upbeat. Let it show.' },
  { id: 'angry',   label: '😤 Angry',    prompt: 'You are in a short-tempered, irritable mood. Replies are snappy and tense.' },
  { id: 'drunk',   label: '🍺 Drunk',    prompt: 'You are slightly drunk. Your speech is loose, rambling, funnier than usual, slightly slurred in text (occasional typo or "heh").' },
  { id: 'tired',   label: '😴 Tired',    prompt: 'You are exhausted and barely keeping it together. Short sentences. Low energy. Maybe a yawn.' },
  { id: 'serious', label: '🧊 Cold',     prompt: 'You are in a cold, serious, no-nonsense mode. No jokes. Maximum intensity.' },
];

// ── Scenarios ─────────────────────────────────────────────────
// Each character id maps to a list of scenario starters
const SCENARIOS = {
  "arya-stark":       ["You've just crossed a name off your list", "You're training in Braavos", "You just arrived at Winterfell"],
  "tyrion":           ["You're on trial for your life", "You're drunk at a feast", "You're advising a new queen"],
  "daenerys":         ["Your dragons just hatched", "You've just taken King's Landing", "You're rallying the Dothraki"],
  "jon-snow":         ["You just came back from beyond the Wall", "You've just been told your true identity", "The Night King approaches"],
  "cersei":           ["You're alone in the Red Keep", "Jaime has just left you", "You're planning revenge"],
  "harry-potter":     ["You just arrived at Hogwarts for the first time", "The Triwizard Tournament is announced", "You've just seen Voldemort return"],
  "hermione":         ["You found a new spell in the library", "Ron and Harry ignored your advice again", "You're preparing for O.W.L.s"],
  "ron":              ["You just beat the chess match of your life", "Fred and George are pranking everyone", "You're terrified of spiders right now"],
  "dumbledore":       ["You're giving a speech at the start-of-term feast", "You know something you can't yet tell Harry", "You're young and just met Grindelwald"],
  "voldemort":        ["You're creating a new Horcrux", "Harry Potter has just escaped you again", "You're meeting your Death Eaters"],
  "snape":            ["You're teaching Potions and someone keeps getting it wrong", "You're alone thinking about Lily", "Dumbledore has given you a new mission"],
  "tony-stark":       ["You're in the lab at 3am", "The Avengers just failed a mission", "You're about to enter a portal with a nuke"],
  "spiderman":        ["You're late to school because you stopped a mugger", "MJ just asked you something suspicious", "Mr. Stark just called you"],
  "thanos":           ["You've just collected the final Stone", "You're in your garden after the snap", "Gamora has just confronted you"],
  "captain-america":  ["You just woke up in 2012", "You disagree with Tony on the Accords", "Bucky needs you"],
  "batman":           ["It's 2am and Gotham is burning", "You're interrogating a villain", "Alfred just said something wise"],
  "joker":            ["You've just been released from Arkham", "You're explaining your philosophy to Batman", "Your plan is finally working"],
  "yoda":             ["You're meditating on Dagobah", "Luke has just failed a training exercise", "You sense a great disturbance in the Force"],
  "vader":            ["You're standing on the Death Star bridge", "Luke has just refused to join you", "You're alone, helmet off, thinking"],
  "tony-soprano":     ["You're sitting in therapy", "A problem has come up with a business partner", "Carmela is upset with you"],
  "walter-white":     ["You just cooked your first batch", "Jesse has done something stupid again", "Hank is getting too close"],
  "sherlock":         ["A new client has walked in", "You're bored between cases", "Watson is trying to explain your rudeness to someone"],
  "professor":        ["The heist is about to begin", "One of your team is about to break the rules", "The police are closing in"],
};

// ── State ────────────────────────────────────────────────────
const state = {
  user: null,
  token: null,
  characters: [],
  filteredChars: [],
  selectedChar: null,
  selectedMood: 'default',
  sessionId: null,
  messages: [],
  activeFilter: 'All',
  currentView: 'welcome',
  historyLoaded: false,
  // Battle mode
  battleMode: false,
  battleChar1: null,
  battleChar2: null,
  battleMessages: [],
};

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  loadAuth();
  await loadCharacters();
  renderNav();
  renderSidebar();
  renderWelcome();
});

// ── Auth Storage ─────────────────────────────────────────────
function loadAuth() {
  const token = localStorage.getItem('cv_token');
  const user  = localStorage.getItem('cv_user');
  if (token && user) { state.token = token; state.user = JSON.parse(user); }
}
function saveAuth(token, user) {
  state.token = token; state.user = user;
  localStorage.setItem('cv_token', token);
  localStorage.setItem('cv_user', JSON.stringify(user));
}
function clearAuth() {
  state.token = null; state.user = null; state.sessionId = null;
  localStorage.removeItem('cv_token'); localStorage.removeItem('cv_user');
}

// ── API Helpers ───────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true', ...options.headers };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Load Characters ───────────────────────────────────────────
async function loadCharacters() {
  try {
    state.characters = await apiFetch('/characters');
    state.filteredChars = [...state.characters];
  } catch (e) {
    console.error('Failed to load characters:', e);
    state.characters = [];
    state.filteredChars = [];
  }
}

// ── Navbar ────────────────────────────────────────────────────
function renderNav() {
  const navRight = document.getElementById('nav-right');
  navRight.innerHTML = '';
  if (state.user) {
    const initials = state.user.displayName?.slice(0,2).toUpperCase() || 'CV';
    navRight.innerHTML = `
      <div class="nav-user">
        <div class="nav-avatar">${initials}</div>
        <span>${state.user.displayName || state.user.username}</span>
      </div>
      <button class="nav-btn" onclick="logout()">Logout</button>
    `;
  } else {
    navRight.innerHTML = `
      <button class="nav-btn" onclick="showModal('login')">Login</button>
      <button class="nav-btn primary" onclick="showModal('signup')">Sign Up</button>
    `;
  }
}

// ── Sidebar ───────────────────────────────────────────────────
function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = '';

  const newBtn = document.createElement('button');
  newBtn.className = 'sidebar-new-btn';
  newBtn.innerHTML = `<span>＋</span> New Chat`;
  newBtn.onclick = () => showWelcome();
  sidebar.appendChild(newBtn);

  // Battle mode button
  const battleBtn = document.createElement('button');
  battleBtn.className = 'sidebar-new-btn';
  battleBtn.style.cssText = 'background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.3);color:#ef4444;margin-top:4px;';
  battleBtn.innerHTML = `<span>⚔️</span> Character Battle`;
  battleBtn.onclick = () => showBattleSetup();
  sidebar.appendChild(battleBtn);

  const div1 = document.createElement('div');
  div1.className = 'sidebar-divider';
  sidebar.appendChild(div1);

  if (state.user) {
    const lbl = document.createElement('div');
    lbl.className = 'sidebar-label';
    lbl.textContent = 'Recent Chats';
    sidebar.appendChild(lbl);
    loadAndRenderHistory(sidebar);
  } else {
    const lbl = document.createElement('div');
    lbl.className = 'sidebar-label';
    lbl.textContent = 'History';
    sidebar.appendChild(lbl);
    const info = document.createElement('div');
    info.style.cssText = 'padding:8px 10px;font-size:12px;color:var(--text3);line-height:1.5;';
    info.textContent = 'Sign up to save your chat history across sessions.';
    sidebar.appendChild(info);
    const signupBtn = document.createElement('button');
    signupBtn.className = 'nav-btn primary';
    signupBtn.style.cssText = 'width:100%;margin-top:6px;font-size:12px;';
    signupBtn.textContent = 'Sign Up Free';
    signupBtn.onclick = () => showModal('signup');
    sidebar.appendChild(signupBtn);
  }
}

async function loadAndRenderHistory(sidebar) {
  try {
    const sessions = await apiFetch('/chat/history');
    if (!sessions || sessions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = 'No chats yet. Start one!';
      sidebar.appendChild(empty);
      return;
    }
    sessions.forEach(s => {
      const item = document.createElement('div');
      item.className = 'sidebar-item' + (state.sessionId === s.id ? ' active' : '');
      const char = state.characters.find(c => c.id === s.characterId);
      const icon = char ? char.icon : '💬';
      const lastMsg = s.messages && s.messages.length > 0 ? s.messages[s.messages.length - 1].content : '';
      const preview = lastMsg.length > 32 ? lastMsg.slice(0,32) + '…' : lastMsg;
      item.innerHTML = `
        <span class="si-icon">${icon}</span>
        <div class="si-text">
          <div class="si-name">${s.characterName}</div>
          <div class="si-meta">${preview}</div>
        </div>
        <button class="del-btn" title="Delete" onclick="deleteSession(event,'${s.id}')">✕</button>
      `;
      item.onclick = (e) => { if (!e.target.classList.contains('del-btn')) loadSession(s); };
      sidebar.appendChild(item);
    });
  } catch (e) { console.error('History load failed:', e); }
}

async function deleteSession(e, sessionId) {
  e.stopPropagation();
  try {
    await apiFetch(`/chat/session/${sessionId}`, { method: 'DELETE' });
    if (state.sessionId === sessionId) showWelcome();
    renderSidebar();
    showToast('Chat deleted', 'success');
  } catch (err) { showToast('Failed to delete', 'error'); }
}

async function loadSession(session) {
  const char = state.characters.find(c => c.id === session.characterId);
  if (!char) return;
  state.selectedChar = char;
  state.sessionId = session.id;
  state.messages = session.messages || [];
  state.battleMode = false;
  renderChatInterface(session.messages);
  renderSidebar();
}

// ── Welcome / Character Selection ─────────────────────────────
function showWelcome() {
  state.selectedChar = null;
  state.sessionId = null;
  state.messages = [];
  state.selectedMood = 'default';
  state.battleMode = false;
  state.currentView = 'welcome';
  renderWelcome();
  renderSidebar();
}

function renderWelcome() {
  const chatArea = document.getElementById('chat-area');
  const tags = ['All', ...new Set(state.characters.map(c => c.tag).filter(Boolean))];

  chatArea.innerHTML = `
    <div id="welcome-screen">
      <div class="welcome-title">Welcome to <span>Versona</span></div>
      <p class="welcome-sub">Chat with your favourite fictional characters. ${state.user ? '' : 'Sign up to save your chat history!'}</p>

      <div id="char-selector">
        <div class="selector-row">
          <input id="search-input" type="text" placeholder="🔍  Search characters..." />
          <select id="char-select">
            <option value="">— or pick from dropdown —</option>
            ${state.characters.map(c => `<option value="${c.id}">${c.icon} ${c.name} (${c.universe})</option>`).join('')}
          </select>
          <button class="random-btn" onclick="pickRandom()" title="Random character">🎲 Random</button>
        </div>

        <div class="filter-chips">
          ${tags.map(t => `<button class="chip ${t === 'All' ? 'active' : ''}" onclick="filterChars('${t}', this)">${t}</button>`).join('')}
        </div>

        <div class="char-grid" id="char-grid"></div>

        <!-- Mood selector — hidden until character is selected -->
        <div id="mood-section" style="display:none;margin-top:14px;">
          <div class="mood-label">🎭 Set a mood for <span id="mood-char-name"></span></div>
          <div class="mood-chips" id="mood-chips">
            ${MOODS.map(m => `
              <button class="mood-chip ${m.id === 'default' ? 'active' : ''}"
                      data-mood="${m.id}"
                      onclick="selectMood('${m.id}', this)">
                ${m.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Scenario section — hidden until character is selected -->
        <div id="scenario-section" style="display:none;margin-top:12px;">
          <div class="mood-label">🎬 Start with a scenario <span style="color:var(--text3);font-size:11px;">(optional)</span></div>
          <div class="scenario-chips" id="scenario-chips"></div>
        </div>

        <button class="start-btn" id="start-btn" disabled onclick="startChat()">
          Select a character to start chatting
        </button>
      </div>
    </div>
  `;

  renderCharGrid(state.characters);

  document.getElementById('search-input').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = state.characters.filter(c =>
      (state.activeFilter === 'All' || c.tag === state.activeFilter) &&
      (c.name.toLowerCase().includes(q) || c.universe.toLowerCase().includes(q))
    );
    renderCharGrid(filtered);
  });

  document.getElementById('char-select').addEventListener('change', e => {
    if (!e.target.value) return;
    const char = state.characters.find(c => c.id === e.target.value);
    if (char) selectCharCard(char);
  });
}

function renderCharGrid(chars) {
  const grid = document.getElementById('char-grid');
  if (!grid) return;
  grid.innerHTML = chars.length === 0
    ? `<div style="grid-column:1/-1;text-align:center;color:var(--text3);padding:20px;font-size:13px;">No characters found</div>`
    : chars.map(c => `
        <div class="char-card ${state.selectedChar?.id === c.id ? 'selected' : ''}"
             onclick="selectCharCard(${JSON.stringify(c).replace(/"/g,'&quot;')})">
          <span class="cc-icon">${c.icon}</span>
          <div class="cc-name">${c.name}</div>
          <div class="cc-universe">${c.universe}</div>
          <span class="cc-tag">${c.tag}</span>
        </div>
      `).join('');
}

function filterChars(tag, btn) {
  state.activeFilter = tag;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  const q = document.getElementById('search-input')?.value.toLowerCase() || '';
  const filtered = state.characters.filter(c =>
    (tag === 'All' || c.tag === tag) &&
    (!q || c.name.toLowerCase().includes(q) || c.universe.toLowerCase().includes(q))
  );
  renderCharGrid(filtered);
}

function selectCharCard(char) {
  state.selectedChar = char;
  state.selectedMood = 'default';
  state.selectedScenario = null;

  renderCharGrid(
    state.activeFilter === 'All'
      ? state.characters
      : state.characters.filter(c => c.tag === state.activeFilter)
  );

  const btn = document.getElementById('start-btn');
  if (btn) { btn.disabled = false; btn.textContent = `Chat with ${char.name} →`; }

  const sel = document.getElementById('char-select');
  if (sel) sel.value = char.id;

  // Show mood section
  const moodSection = document.getElementById('mood-section');
  const moodCharName = document.getElementById('mood-char-name');
  if (moodSection) {
    moodSection.style.display = 'block';
    if (moodCharName) moodCharName.textContent = char.name;
  }
  // Reset mood chips
  document.querySelectorAll('.mood-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.mood === 'default');
  });

  // Show scenarios if any exist for this character
  const scenarioSection = document.getElementById('scenario-section');
  const scenarioChips = document.getElementById('scenario-chips');
  const scenarios = SCENARIOS[char.id];
  if (scenarioSection && scenarioChips) {
    if (scenarios && scenarios.length > 0) {
      scenarioSection.style.display = 'block';
      scenarioChips.innerHTML = scenarios.map(s => `
        <button class="scenario-chip" onclick="selectScenario(this, '${s.replace(/'/g, "\\'")}')">${s}</button>
      `).join('');
    } else {
      scenarioSection.style.display = 'none';
    }
  }
}

function selectMood(moodId, btn) {
  state.selectedMood = moodId;
  document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}

function selectScenario(btn, scenario) {
  state.selectedScenario = scenario;
  document.querySelectorAll('.scenario-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}

function pickRandom() {
  if (!state.characters.length) return;
  const char = state.characters[Math.floor(Math.random() * state.characters.length)];
  selectCharCard(char);
  // Scroll char into view in grid
  const grid = document.getElementById('char-grid');
  if (grid) {
    const selected = grid.querySelector('.char-card.selected');
    if (selected) selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  showToast(`🎲 Randomly picked ${char.name}!`, 'success');
}

function startChat() {
  if (!state.selectedChar) return;
  state.sessionId = null;
  state.messages = [];
  state.battleMode = false;
  renderChatInterface([]);
  renderSidebar();
}

// ── Chat Interface ────────────────────────────────────────────
function renderChatInterface(existingMessages) {
  state.currentView = 'chat';
  const char = state.selectedChar;
  const chatArea = document.getElementById('chat-area');
  const mood = MOODS.find(m => m.id === state.selectedMood) || MOODS[0];
  const moodBadge = mood.id !== 'default'
    ? `<span class="mood-badge">${mood.label}</span>`
    : '';

  chatArea.innerHTML = `
    <div id="chat-interface">
      <div id="chat-header">
        <div class="ch-icon">${char.icon}</div>
        <div>
          <div class="ch-name">${char.name} ${moodBadge}</div>
          <div class="ch-universe">${char.universe}</div>
        </div>
        <div class="ch-actions">
          ${!state.user ? '<span class="guest-badge">Guest — history not saved</span>' : ''}
          <button class="icon-btn" title="Change character" onclick="showWelcome()">⬅</button>
        </div>
      </div>

      <div id="messages"></div>
      <div id="suggestions"></div>

      <div id="input-area">
        <div id="input-row">
          <textarea id="msg-input" placeholder="Type a message…" rows="1"></textarea>
          <button id="send-btn" onclick="sendMessage()">➤</button>
        </div>
        <div class="input-hint">Press Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  `;

  if (existingMessages && existingMessages.length > 0) {
    existingMessages.forEach(m => appendMessage(m.role, m.content, false));
  } else {
    // If a scenario was selected, open with it
    if (state.selectedScenario) {
      appendMessage('ai', `${char.icon}  *${state.selectedScenario}*\n\n${getScenarioOpener(char, state.selectedScenario)}`, false);
    } else {
      appendMessage('ai', `${char.icon}  Hello! I'm ${char.name}. How can I help you today?`, false);
    }
  }

  renderSuggestions(char.suggestions);

  const input = document.getElementById('msg-input');
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  scrollToBottom();
}

function getScenarioOpener(char, scenario) {
  // Generic opener — the character will pick up from here
  return `[Setting the scene: ${scenario}]`;
}

function renderSuggestions(sugs) {
  const el = document.getElementById('suggestions');
  if (!el || !sugs) return;
  el.innerHTML = sugs.map(s =>
    `<button class="sug-btn" onclick="useSuggestion('${s.replace(/'/g, "\\'")}')">${s}</button>`
  ).join('');
}

function useSuggestion(text) {
  const input = document.getElementById('msg-input');
  if (input) { input.value = text; input.focus(); }
  sendMessage();
}

// ── Send Message ──────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('msg-input');
  const text = input?.value.trim();
  if (!text || !state.selectedChar) return;

  input.value = '';
  input.style.height = 'auto';

  const sugsEl = document.getElementById('suggestions');
  if (sugsEl) sugsEl.innerHTML = '';

  appendMessage('user', text, false);

  const typingId = appendTyping();
  document.getElementById('send-btn').disabled = true;

  try {
    let reply;
    const mood = MOODS.find(m => m.id === state.selectedMood) || MOODS[0];
    const moodPrompt = mood.prompt;
    const scenarioContext = state.selectedScenario && state.messages.length <= 2
      ? `Current scenario context: ${state.selectedScenario}.`
      : '';

    if (state.user && state.token) {
      const data = await apiFetch('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          characterId: state.selectedChar.id,
          sessionId: state.sessionId || '',
          message: text,
          moodPrompt: moodPrompt,
          scenarioContext: scenarioContext,
        })
      });
      reply = data.reply;
      state.sessionId = data.sessionId;
      renderSidebar();
    } else {
      state.messages.push({ role: 'user', content: text });
      const data = await apiFetch('/chat/guest', {
        method: 'POST',
        body: JSON.stringify({
          characterId: state.selectedChar.id,
          messages: state.messages,
          moodPrompt: moodPrompt,
          scenarioContext: scenarioContext,
        })
      });
      reply = data.reply;
      state.messages.push({ role: 'assistant', content: reply });
    }

    removeTyping(typingId);
    appendMessage('ai', reply, true);

  } catch (err) {
    removeTyping(typingId);
    appendMessage('ai', '⚠️ Something went wrong. Please try again.', false);
    showToast(err.message || 'Error sending message', 'error');
  }

  document.getElementById('send-btn').disabled = false;
  document.getElementById('msg-input')?.focus();
}

// ── Message Rendering ─────────────────────────────────────────
function appendMessage(role, content, animate) {
  const messages = document.getElementById('messages');
  if (!messages) return;

  const wrap = document.createElement('div');
  wrap.className = `msg-wrap ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'ai' ? (state.selectedChar?.icon || '🤖') : '🧑';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  const inner = document.createElement('div');
  inner.textContent = content;

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  bubble.appendChild(inner);
  bubble.appendChild(time);
  wrap.appendChild(avatar);
  wrap.appendChild(bubble);

  if (animate) {
    wrap.style.opacity = '0';
    wrap.style.transform = 'translateY(8px)';
    wrap.style.transition = 'all 0.2s ease';
    messages.appendChild(wrap);
    requestAnimationFrame(() => { wrap.style.opacity = '1'; wrap.style.transform = 'translateY(0)'; });
  } else {
    messages.appendChild(wrap);
  }
  scrollToBottom();
}

function appendTyping() {
  const messages = document.getElementById('messages');
  if (!messages) return null;
  const id = 'typing_' + Date.now();
  const wrap = document.createElement('div');
  wrap.className = 'msg-wrap ai'; wrap.id = id;
  wrap.innerHTML = `
    <div class="msg-avatar">${state.selectedChar?.icon || '🤖'}</div>
    <div class="msg-bubble">
      <div class="typing-indicator">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>
    </div>
  `;
  messages.appendChild(wrap);
  scrollToBottom();
  return id;
}

function removeTyping(id) { if (id) document.getElementById(id)?.remove(); }
function scrollToBottom() {
  const messages = document.getElementById('messages');
  if (messages) messages.scrollTop = messages.scrollHeight;
}

// ── BATTLE MODE ───────────────────────────────────────────────
function showBattleSetup() {
  state.battleMode = true;
  state.battleChar1 = null;
  state.battleChar2 = null;
  state.battleMessages = [];
  state.currentView = 'battle-setup';

  const chatArea = document.getElementById('chat-area');
  const tags = ['All', ...new Set(state.characters.map(c => c.tag).filter(Boolean))];

  chatArea.innerHTML = `
    <div id="battle-setup">
      <div class="battle-title">⚔️ Character <span>Battle</span></div>
      <p class="battle-sub">Pick two characters. You set the topic. Watch them go at each other.</p>

      <div class="battle-pickers">
        <div class="battle-picker" id="picker1">
          <div class="bp-label">Character 1</div>
          <div class="bp-placeholder" id="bp1-display">Choose a character</div>
          <div class="bp-grid" id="bp1-grid"></div>
        </div>

        <div class="vs-badge">VS</div>

        <div class="battle-picker" id="picker2">
          <div class="bp-label">Character 2</div>
          <div class="bp-placeholder" id="bp2-display">Choose a character</div>
          <div class="bp-grid" id="bp2-grid"></div>
        </div>
      </div>

      <div class="battle-topic-row">
        <input id="battle-topic" type="text" placeholder="💬 Set the debate topic — e.g. 'Who is the better leader?'" />
      </div>

      <button class="start-btn" id="battle-start-btn" disabled onclick="startBattle()">
        Pick both characters to start
      </button>
      <button class="nav-btn" style="margin-top:8px;width:100%;" onclick="showWelcome()">← Back</button>
    </div>
  `;

  renderBattleGrid(1, state.characters);
  renderBattleGrid(2, state.characters);
}

function renderBattleGrid(slot, chars) {
  const grid = document.getElementById(`bp${slot}-grid`);
  if (!grid) return;
  grid.innerHTML = chars.map(c => `
    <div class="bp-card ${(slot === 1 ? state.battleChar1 : state.battleChar2)?.id === c.id ? 'selected' : ''}"
         onclick="selectBattleChar(${slot}, ${JSON.stringify(c).replace(/"/g,'&quot;')})">
      <span>${c.icon}</span>
      <span>${c.name}</span>
    </div>
  `).join('');
}

function selectBattleChar(slot, char) {
  if (slot === 1) state.battleChar1 = char;
  else state.battleChar2 = char;

  const display = document.getElementById(`bp${slot}-display`);
  if (display) display.innerHTML = `<span style="font-size:20px">${char.icon}</span> ${char.name}`;

  renderBattleGrid(1, state.characters);
  renderBattleGrid(2, state.characters);

  if (state.battleChar1 && state.battleChar2) {
    const btn = document.getElementById('battle-start-btn');
    if (btn) { btn.disabled = false; btn.textContent = `⚔️ Start Battle: ${state.battleChar1.name} vs ${state.battleChar2.name}`; }
  }
}

function startBattle() {
  if (!state.battleChar1 || !state.battleChar2) return;
  const topic = document.getElementById('battle-topic')?.value.trim() || 'who is the better person';
  state.battleMessages = [];
  renderBattleInterface(topic);
}

function renderBattleInterface(topic) {
  state.currentView = 'battle';
  const c1 = state.battleChar1;
  const c2 = state.battleChar2;
  const chatArea = document.getElementById('chat-area');

  chatArea.innerHTML = `
    <div id="chat-interface">
      <div id="chat-header" style="gap:8px;">
        <div class="ch-icon">${c1.icon}</div>
        <div>
          <div class="ch-name">${c1.name} <span style="color:var(--text3)">vs</span> ${c2.name} ${c2.icon}</div>
          <div class="ch-universe">Topic: <em>${topic}</em></div>
        </div>
        <div class="ch-actions">
          <button class="icon-btn" title="Back" onclick="showBattleSetup()">⬅</button>
        </div>
      </div>

      <div id="messages"></div>

      <div id="battle-controls" style="padding:10px 20px;display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid var(--border);background:var(--bg2);">
  <button class="battle-speak-btn" onclick="battleSpeak(1)">
    ${c1.icon} ${c1.name} speaks
  </button>
  <button class="battle-speak-btn" onclick="battleSpeak(2)">
    ${c2.icon} ${c2.name} speaks
  </button>
  <div style="display:flex;flex:1;min-width:160px;gap:6px;">
    <input id="battle-nudge" type="text" placeholder="Nudge the conversation… (optional)"
      style="flex:1;padding:8px 12px;background:var(--bg3);border:1px solid var(--border2);border-radius:var(--radius);color:var(--text);font-size:12px;"
      onkeydown="if(event.key==='Enter') sendNudge()" />
    <button class="battle-speak-btn" onclick="sendNudge()" style="white-space:nowrap;">➤ Send</button>
  </div>
</div>
    </div>
  `;

  // Kick off with char 1
  const opener = `The topic is: "${topic}". The other person is ${c2.name} from ${c2.universe}. Start by stating your position on the topic in 2-3 sentences.`;
  state.battleMessages.push({ role: 'user', content: opener });
  triggerBattleSpeak(1, opener, topic);
}

async function battleSpeak(slot, nudgeText) {
  const c1 = state.battleChar1;
  const c2 = state.battleChar2;
  const speakingChar = slot === 1 ? c1 : c2;
  const opposingChar = slot === 1 ? c2 : c1;

  const lastMsg = state.battleMessages.length > 0
    ? state.battleMessages[state.battleMessages.length - 1].content
    : '';

  const prompt = nudgeText
    ? `The user wants to steer the conversation: "${nudgeText}". Respond as ${speakingChar.name} keeping this direction in mind. Address ${opposingChar.name} directly.`
    : `Respond as ${speakingChar.name}. Address what ${opposingChar.name} just said: "${lastMsg.slice(0, 120)}". Be direct, stay in character, be punchy.`;

  await triggerBattleSpeak(slot, prompt, null);
}

async function triggerBattleSpeak(slot, prompt, topic) {
  const speakingChar = slot === 1 ? state.battleChar1 : state.battleChar2;
  const opposingChar = slot === 1 ? state.battleChar2 : state.battleChar1;

  // Disable buttons
  document.querySelectorAll('.battle-speak-btn').forEach(b => b.disabled = true);

  const typingId = appendBattleTyping(speakingChar);

  try {
    const battleSystemSuffix = `\nYou are in a debate/conversation with ${opposingChar.name} from ${opposingChar.universe}. Stay fully in character. Be direct and punchy — 2-4 sentences max. Address the other character directly.`;

    const data = await apiFetch('/chat/guest', {
      method: 'POST',
      body: JSON.stringify({
        characterId: speakingChar.id,
        messages: [{ role: 'user', content: prompt }],
        moodPrompt: '',
        scenarioContext: battleSystemSuffix,
      })
    });

    removeTyping(typingId);
    const reply = data.reply;
    state.battleMessages.push({ role: 'assistant', content: reply, speaker: slot });
    appendBattleMessage(speakingChar, reply);

  } catch (err) {
    removeTyping(typingId);
    appendBattleMessage(speakingChar, '⚠️ Something went wrong.');
  }

  document.querySelectorAll('.battle-speak-btn').forEach(b => b.disabled = false);
}

function appendBattleMessage(char, content) {
  const messages = document.getElementById('messages');
  if (!messages) return;

  const wrap = document.createElement('div');
  wrap.className = 'msg-wrap ai';

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = char.icon;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  const nameTag = document.createElement('div');
  nameTag.style.cssText = 'font-size:10px;font-weight:600;color:var(--accent);margin-bottom:3px;';
  nameTag.textContent = char.name;

  const inner = document.createElement('div');
  inner.textContent = content;

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  bubble.appendChild(nameTag);
  bubble.appendChild(inner);
  bubble.appendChild(time);
  wrap.appendChild(avatar);
  wrap.appendChild(bubble);

  wrap.style.opacity = '0'; wrap.style.transform = 'translateY(8px)'; wrap.style.transition = 'all 0.2s ease';
  messages.appendChild(wrap);
  requestAnimationFrame(() => { wrap.style.opacity = '1'; wrap.style.transform = 'translateY(0)'; });
  scrollToBottom();
}

function appendBattleTyping(char) {
  const messages = document.getElementById('messages');
  if (!messages) return null;
  const id = 'typing_' + Date.now();
  const wrap = document.createElement('div');
  wrap.className = 'msg-wrap ai'; wrap.id = id;
  wrap.innerHTML = `
    <div class="msg-avatar">${char.icon}</div>
    <div class="msg-bubble">
      <div style="font-size:10px;font-weight:600;color:var(--accent);margin-bottom:3px;">${char.name}</div>
      <div class="typing-indicator">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>
    </div>
  `;
  messages.appendChild(wrap);
  scrollToBottom();
  return id;
}

function sendNudge() {
  const input = document.getElementById('battle-nudge');
  const nudge = input?.value.trim();
  if (!nudge) return;
  input.value = '';

  // figure out who should respond — whoever spoke last, the OTHER one responds
  const lastChar = state.battleMessages.length > 0 ? state.battleMessages[state.battleMessages.length - 1].speaker : null;
  const slot = lastChar === 1 ? 2 : 1;

  battleSpeak(slot, nudge);
}

// ── Auth Modal ────────────────────────────────────────────────
function showModal(type) {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop'; backdrop.id = 'modal-backdrop';
  backdrop.onclick = e => { if (e.target === backdrop) closeModal(); };
  const isLogin = type === 'login';
  backdrop.innerHTML = `
    <div class="modal">
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div class="modal-title">${isLogin ? 'Welcome back' : 'Create account'}</div>
      <div class="modal-sub">${isLogin ? 'Login to save your chat history' : 'Sign up to unlock chat history & more'}</div>
      <div id="modal-error" class="modal-error" style="display:none;"></div>
      ${!isLogin ? `
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input class="form-input" id="f-displayname" type="text" placeholder="How should we call you?" />
        </div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input class="form-input" id="f-username" type="text" placeholder="Choose a username" />
        </div>
      ` : ''}
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" id="f-email" type="email" placeholder="your@email.com" />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-input" id="f-password" type="password" placeholder="Password" />
      </div>
      <button class="form-btn" id="modal-submit" onclick="${isLogin ? 'submitLogin()' : 'submitSignup()'}">
        ${isLogin ? 'Login' : 'Create Account'}
      </button>
      <div class="modal-switch">
        ${isLogin
          ? `Don't have an account? <a onclick="showModal('signup')">Sign up</a>`
          : `Already have an account? <a onclick="showModal('login')">Login</a>`}
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  setTimeout(() => document.getElementById('f-email')?.focus(), 100);
}

function closeModal() { document.getElementById('modal-backdrop')?.remove(); }
function showModalError(msg) {
  const el = document.getElementById('modal-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

async function submitLogin() {
  const email = document.getElementById('f-email')?.value.trim();
  const password = document.getElementById('f-password')?.value;
  if (!email || !password) { showModalError('Please fill in all fields'); return; }
  const btn = document.getElementById('modal-submit');
  btn.disabled = true; btn.textContent = 'Logging in…';
  try {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    saveAuth(data.token, data.user);
    closeModal(); renderNav(); renderSidebar();
    showToast(`Welcome back, ${data.user.displayName}!`, 'success');
  } catch (e) {
    showModalError(e.message); btn.disabled = false; btn.textContent = 'Login';
  }
}

async function submitSignup() {
  const displayName = document.getElementById('f-displayname')?.value.trim();
  const username = document.getElementById('f-username')?.value.trim();
  const email = document.getElementById('f-email')?.value.trim();
  const password = document.getElementById('f-password')?.value;
  if (!username || !email || !password) { showModalError('Please fill in all required fields'); return; }
  const btn = document.getElementById('modal-submit');
  btn.disabled = true; btn.textContent = 'Creating account…';
  try {
    const data = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, displayName: displayName || username })
    });
    saveAuth(data.token, data.user);
    closeModal(); renderNav(); renderSidebar();
    showToast(`Welcome to Versona, ${data.user.displayName}!`, 'success');
  } catch (e) {
    showModalError(e.message); btn.disabled = false; btn.textContent = 'Create Account';
  }
}

function logout() {
  clearAuth(); state.selectedChar = null; state.sessionId = null; state.messages = [];
  renderNav(); renderSidebar(); showWelcome();
  showToast('Logged out successfully', 'success');
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg; toast.className = 'show ' + type;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.className = ''; }, 3000);
}