import { esc } from '../ui.js';

const NEIGHBOURHOODS = [
  'Cetate',
  'Fabric',
  'Iosefin',
  'Elisabetin',
  'Mehala',
  'Complex Studențesc',
  'Circumvalațiunii'
];

/** The log-in & register window. Residents and city staff use this form; connected to database. */
export function renderAuthModal({ error = '', mode = 'login' } = {}) {
  const isRegister = mode === 'register';

  return `
    <div class="scrim" id="authBackdrop">
      <div class="dialog auth-dialog" role="dialog" aria-modal="true" aria-labelledby="authTitle" style="max-width:440px;">
        <div class="auth-tabs" style="display:flex;gap:8px;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:12px;">
          <button class="pill ${!isRegister ? 'on' : ''}" id="tabLoginBtn" type="button" style="flex:1;text-align:center;padding:8px 0;">Log in</button>
          <button class="pill ${isRegister ? 'on' : ''}" id="tabRegisterBtn" type="button" style="flex:1;text-align:center;padding:8px 0;">Register</button>
        </div>

        <h2 id="authTitle">${isRegister ? 'Join Timișoara Hub' : 'Log in to hop'}</h2>
        <p class="lead">${isRegister ? 'Create an account to get tickets, post in the forum, and save favourite places.' : 'See what is happening in your city, join in, and keep your tickets with you.'}</p>

        ${error ? `<p class="auth-error" role="alert" style="margin-top:10px;">${esc(error)}</p>` : ''}

        <div class="stack" style="margin-top:16px;">
          <button class="btn btn-primary btn-block auth0-primary-btn" id="auth0LoginBtn" type="button" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 16px;font-size:15px;font-weight:600;">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A7.003 7.003 0 0 1 5.07 11H5a1 1 0 0 1 0-2h.07A7.003 7.003 0 0 1 11 5.07V5a1 1 0 0 1 2 0v.07A7.003 7.003 0 0 1 18.93 11H19a1 1 0 0 1 0 2h-.07A7.003 7.003 0 0 1 13 16.93z"/>
            </svg>
            ${isRegister ? 'Sign up with Auth0' : 'Continue with Auth0'}
          </button>
          <p class="muted" style="text-align:center;font-size:12px;margin-top:6px;">Google, Email & Passkey unified in one secure login</p>
        </div>

        <div class="auth-divider"><span>or with email</span></div>

        ${isRegister ? `
          <form class="stack" id="registerForm">
            <label class="field">
              <span>Full Name</span>
              <input id="regNameInput" type="text" autocomplete="name" placeholder="Andrei Timișan" required minlength="2">
            </label>
            <label class="field">
              <span>Email</span>
              <input id="regEmailInput" type="email" autocomplete="email" placeholder="you@example.com" required>
            </label>
            <label class="field">
              <span>Neighbourhood</span>
              <select id="regNeighbourhoodSelect">
                ${NEIGHBOURHOODS.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('')}
              </select>
            </label>
            <label class="field">
              <span>Password (optional)</span>
              <input id="regPasswordInput" type="password" autocomplete="new-password" placeholder="••••••••">
            </label>
            <button class="btn btn-primary btn-block" type="submit" id="submitRegisterBtn" style="margin-top:6px;">Create account</button>
          </form>
          <div style="text-align:center;margin-top:14px;font-size:14px;">
            <span class="muted">Already have an account?</span> <button class="link" id="switchToLoginBtn" type="button">Log in</button>
          </div>
        ` : `
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
          <div style="text-align:center;margin-top:14px;font-size:14px;">
            <span class="muted">No account yet?</span> <button class="link" id="switchToRegisterBtn" type="button">Register</button>
          </div>

          <div class="auth-demo" style="margin-top:16px;">
            <span>Demo accounts</span>
            <button class="link" id="demoResidentBtn" type="button">Resident</button>
            <button class="link" id="demoAdminBtn" type="button">City admin</button>
          </div>
        `}

        <div style="text-align:center;margin-top:14px;"><button class="link muted-link" id="closeAuthBtn" type="button">Not now</button></div>
      </div>
    </div>`;
}
