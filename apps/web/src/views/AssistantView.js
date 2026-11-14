import { askAssistant } from '../api.js';
import { art, esc } from '../ui.js';
import { CITY } from '../city.js';

let history = [];
const SUGGESTIONS = ['Are there outages near Circumvalațiunii?', 'Where can I park near Piața Unirii?', 'What events are on this week?', 'Is tram 5 running on Calea Bogdăneștilor?'];

export async function render(ctx) {
  const chat = `<div class="chat">
      <div class="stream" id="stream" aria-live="polite">
        <div class="bubble bot">Hi! Ask me about outages, transit, parking or events in ${esc(CITY.name)}. I answer in Romanian or English.</div>
      </div>
      <div class="chips suggest" id="suggest">${SUGGESTIONS.map((s) => `<button class="chip" data-ask="${esc(s)}">${esc(s)}</button>`).join('')}</div>
      <form class="composer" id="askForm"><input id="askInput" placeholder="Ask a question" autocomplete="off" aria-label="Your question"><button class="btn btn-ink" type="submit">Send</button></form>
    </div>`;
  return `<div class="page" style="max-width:900px">
    <div style="display:flex;gap:20px;align-items:center">${art('assistant', 64)}<div><h1 class="page-title" style="font-size:34px;line-height:40px">City assistant</h1><p class="muted">Answers from live city data.</p></div></div>
    <div style="margin-top:24px">${ctx.loggedIn ? chat
      : `<div class="locked"><div class="blurred">${chat}</div><div class="door"><div><h3>Ask hop anything</h3><p>Log in to chat with the city assistant.</p><button class="btn btn-primary" data-login>Log in</button></div></div></div>`}</div>
  </div>`;
}

export function mount(ctx) {
  const stream = document.getElementById('stream');
  const form = document.getElementById('askForm');
  if (!ctx.loggedIn || !form) return () => {};
  const input = document.getElementById('askInput');
  const add = (cls, html) => {
    const d = document.createElement('div');
    d.className = `bubble ${cls}`;
    d.innerHTML = html;
    stream.appendChild(d);
    stream.scrollTop = stream.scrollHeight;
    return d;
  };
  async function ask(text) {
    if (!text.trim()) return;
    document.getElementById('suggest')?.remove();
    add('me', esc(text));
    input.value = '';
    const wait = add('bot', '<em class="muted">Looking it up…</em>');
    try {
      const res = await askAssistant(text, history);
      const reply = res.reply || 'I could not get an answer.';
      history.push({ role: 'user', text }, { role: 'model', text: reply });
      wait.innerHTML = esc(reply) + (res.toolsUsed?.length ? `<small>Sources: ${[...new Set(res.toolsUsed.map((t) => t.moduleId))].map(esc).join(' · ')}</small>` : '');
    } catch {
      wait.innerHTML = 'The assistant is not answering right now.';
    }
    stream.scrollTop = stream.scrollHeight;
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    ask(input.value);
  });
  document.querySelectorAll('[data-ask]').forEach((b) => b.addEventListener('click', () => ask(b.dataset.ask)));
  return () => {};
}
