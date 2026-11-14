import { askAssistant } from '../api.js';

let chatHistory = [];

export function renderAssistantView() {
  return `
    <div class="view-content assistant-view">
      
      <div class="assistant-container">
        
        <!-- Chat Header -->
        <div class="assistant-header">
          <div class="assistant-brand">
            <span class="bot-avatar">🤖</span>
            <div>
              <div class="bot-name">Asistent Virtual Timișoara</div>
              <div class="bot-sub">Alimentat de Google Gemini cu acces în timp real la datele orașului</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" id="clearChatBtn">Șterge Istoric</button>
        </div>

        <!-- Chat Messages -->
        <div class="chat-messages" id="chatMessages">
          <div class="chat-bubble bot-bubble">
            <div class="bubble-sender">Asistent Timișoara</div>
            <div class="bubble-text">
              Bună ziua! Sunt asistentul digital al orașului Timișoara. Vă pot ajuta cu informații despre avariile de încălzire și apă (Colterm/Aquatim), rutele și devierile STPT, locurile libere de parcare Parkie sau evenimentele culturale din oraș. Cu ce vă pot fi de folos?
            </div>
          </div>
        </div>

        <!-- Predefined Quick Questions -->
        <div class="quick-prompts">
          <button class="prompt-chip" data-prompt="Sunt avarii la încălzire sau apă în Circumvalațiunii?">
            🔥 Avarii Circumvalațiunii
          </button>
          <button class="prompt-chip" data-prompt="Unde găsesc parcare liberă lângă Piața Unirii?">
            🅿️ Parcare Piața Unirii
          </button>
          <button class="prompt-chip" data-prompt="Ce evenimente culturale au loc în Timișoara?">
            🎭 Evenimente culturale
          </button>
          <button class="prompt-chip" data-prompt="Cum circulă tramvaiele pe Calea Bogdăneștilor?">
            🚊 Linia 5 Bogdăneștilor
          </button>
        </div>

        <!-- Chat Input Bar -->
        <div class="chat-input-bar">
          <input type="text" id="assistantInput" class="form-control chat-input" placeholder="Scrieți o întrebare despre orașul Timișoara..." autocomplete="off">
          <button class="btn btn-primary send-btn" id="sendAssistantBtn">Trimite</button>
        </div>

      </div>

    </div>
  `;
}

export function initAssistantLogic() {
  const inputEl = document.getElementById('assistantInput');
  const sendBtn = document.getElementById('sendAssistantBtn');
  const messagesEl = document.getElementById('chatMessages');
  const clearBtn = document.getElementById('clearChatBtn');

  async function sendMessage(text) {
    if (!text || !text.trim()) return;

    // Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-bubble user-bubble';
    userMsg.innerHTML = `
      <div class="bubble-sender">Dumneavoastră</div>
      <div class="bubble-text">${escapeHtml(text)}</div>
    `;
    messagesEl.appendChild(userMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    inputEl.value = '';
    sendBtn.disabled = true;

    // Loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-bubble bot-bubble loading-bubble';
    loadingMsg.innerHTML = `
      <div class="bubble-sender">Asistent Timișoara</div>
      <div class="bubble-text"><em>Asistentul analizează datele orașului...</em></div>
    `;
    messagesEl.appendChild(loadingMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const res = await askAssistant(text, chatHistory);
    loadingMsg.remove();

    const botReply = res.reply || 'Nu am putut obține un răspuns.';
    chatHistory.push({ role: 'user', text });
    chatHistory.push({ role: 'model', text: botReply });

    // Append Bot Message
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-bubble bot-bubble';
    
    let toolsHtml = '';
    if (res.toolsUsed && res.toolsUsed.length > 0) {
      toolsHtml = `
        <div class="tools-badge-container">
          <span class="tools-label">Surse date consultate:</span>
          ${res.toolsUsed.map(t => `<span class="tool-tag">${t.name} (${t.moduleId})</span>`).join('')}
        </div>
      `;
    }

    botMsg.innerHTML = `
      <div class="bubble-sender">Asistent Timișoara</div>
      <div class="bubble-text">${escapeHtml(botReply)}</div>
      ${toolsHtml}
    `;
    messagesEl.appendChild(botMsg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    sendBtn.disabled = false;
  }

  sendBtn?.addEventListener('click', () => sendMessage(inputEl.value));
  inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage(inputEl.value);
  });

  document.querySelectorAll('.prompt-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-prompt');
      sendMessage(prompt);
    });
  });

  clearBtn?.addEventListener('click', () => {
    chatHistory = [];
    messagesEl.innerHTML = `
      <div class="chat-bubble bot-bubble">
        <div class="bubble-sender">Asistent Timișoara</div>
        <div class="bubble-text">Istoricul a fost șters. Cu ce vă pot ajuta?</div>
      </div>
    `;
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
