import { esc } from '../ui.js';

/** One sign-in for everyone, like any social site. The server decides what the account may do: staff get the dashboard. */
export function renderAuthModal({ error = '' } = {}) {
  return `
    <div class="scrim" id="authBackdrop">
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="authTitle">
        <h2 id="authTitle">Log in to hop</h2>
        <p class="lead">See what is happening in your city, join in, and keep your tickets with you.</p>
        <div class="stack">
          <button class="btn btn-primary btn-block" id="googleLoginBtn">Continue with Google</button>
        </div>
        <p class="or">or</p>
        <form class="stack" id="emailForm">
          <label class="field"><span>Email</span><input id="emailInput" type="email" autocomplete="email" placeholder="you@example.com" required></label>
          <button class="btn btn-secondary btn-block" type="submit">Continue with email</button>
        </form>
        ${error ? `<p class="error" role="alert">${esc(error)}</p>` : ''}
        <p class="or">Demo accounts</p>
        <div class="row-inline">
          <button class="btn btn-text btn-md btn-block" id="demoResidentBtn">Resident</button>
          <button class="btn btn-text btn-md btn-block" id="demoAdminBtn">City admin</button>
        </div>
        <p class="note">Sign-in is simulated in this demo. City staff use their @timisoara-hub.ro account and land on the dashboard.</p>
        <p style="text-align:center;margin-top:10px"><button class="link" id="closeAuthBtn">Not now</button></p>
      </div>
    </div>`;
}
