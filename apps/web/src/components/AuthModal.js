import { esc } from '../ui.js';

/** The log-in window. Residents and city staff use the same form; the website tells them apart by the account. */
export function renderAuthModal({ error = '' } = {}) {
  return `
    <div class="scrim" id="authBackdrop">
      <div class="dialog auth-dialog" role="dialog" aria-modal="true" aria-labelledby="authTitle">
        <h2 id="authTitle">Log in to hop</h2>
        <p class="lead">See what is happening in your city, join in, and keep your tickets with you.</p>

        ${error ? `<p class="auth-error" role="alert">${esc(error)}</p>` : ''}

        <div class="stack" style="margin-top:20px;">
          <button class="btn btn-primary btn-block auth0-primary-btn" id="auth0LoginBtn" type="button" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 16px;font-size:15px;font-weight:600;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A7.003 7.003 0 0 1 5.07 11H5a1 1 0 0 1 0-2h.07A7.003 7.003 0 0 1 11 5.07V5a1 1 0 0 1 2 0v.07A7.003 7.003 0 0 1 18.93 11H19a1 1 0 0 1 0 2h-.07A7.003 7.003 0 0 1 13 16.93z"/>
            </svg>
            Continue with Auth0
          </button>
          <p class="muted" style="text-align:center;font-size:12px;margin-top:6px;">Google, Email & Passkey unified in one secure login</p>
        </div>

        <div class="auth-divider"><span>or</span></div>

        <form class="stack" id="emailForm">
          <label class="field">
            <span>Email</span>
            <input id="emailInput" type="email" autocomplete="email" placeholder="you@example.com" required>
          </label>
          <div id="accountTypePreview" class="auth-hint" aria-live="polite"></div>
          <div id="passwordFieldContainer" style="display: none;">
            <label class="field">
              <span>Staff password</span>
              <input id="passwordInput" type="password" autocomplete="current-password">
            </label>
          </div>
          <button class="btn btn-primary btn-block" type="submit" id="submitEmailBtn">Log in</button>
        </form>

        <div class="auth-demo">
          <span>Demo accounts</span>
          <button class="link" id="demoResidentBtn" type="button">Resident</button>
          <button class="link" id="demoAdminBtn" type="button">City admin</button>
        </div>

        <p class="muted auth-note">Sign-in is simulated in this demo. City staff use their @timisoara-hub.ro account and land on the dashboard.</p>
        <div style="text-align:center;margin-top:10px"><button class="link muted-link" id="closeAuthBtn" type="button">Not now</button></div>
      </div>
    </div>`;
}
