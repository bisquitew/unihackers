# 📋 Person 3 (P3) — Community, Social & Solana Lead
**Role:** Community & Social Lead for Timișoara City Hub (`unihackers`)  
**Scope:** `[M01_EVENTS]`, `[M07_BUDDY]`, `[M08_FORUM]`, `[M09_WALLET]`, `@hub/solana`  
**Sponsor Target:** Solana (Best Use of Solana)

---

## 🏆 Current Progress & What's Already Complete

### 1. [M09_WALLET] Solana Devnet Ticketing & POAP Badges
- [x] **Live Organizer Wallet on Devnet:** Keypair `H6oCfQHkpFg6rUhZmx1e6szoRveAVFrN4ji7P4HJvPU1` connected to official Solana Devnet cluster.
- [x] **Zero-Polyfill Client RPC:** Pure HTTP JSON-RPC `fetch` implementation without `@solana/web3.js` polyfill crashes on React Native Web.
- [x] **Sharp Vector QR Codes:** Spec-compliant vector QR generator (`toqr` Level M SVG) readable by phone cameras and built-in door scanners.
- [x] **Venue Door Check-in Scanner:** Fast QR scanner modal with automated signature verification, entrance grant, and on-chain POAP issuance.
- [x] **Direct Solana Explorer Deep Links:** Direct links to `explorer.solana.com/tx/<sig>?cluster=devnet` with confirmed finalized statuses.
- [x] **Persistent Wallet Store:** Tickets, POAPs, and check-in statuses safely persisted in browser `localStorage`.
- [x] **Duplicate Check-in Guard:** Prevents already checked-in tickets from being redeemed more than once.

### 2. [M08_FORUM] Neighbourhood Civic Forum & Moderation
- [x] **Persistent Forum Store (`forumStore.ts`):** All posts, comments, upvotes, and reports persist across browser reloads.
- [x] **Upvote Toggle & Spam Prevention:** Users can toggle upvotes (+1 / -1); prevents infinite upvote spamming.
- [x] **Citizen Reporting Flow:** Residents can report spam or ticket scalping with a single tap (`⚑ Report`). Duplicate reports by the same resident are blocked.
- [x] **Moderation Queue & Control Panel:** Dedicated `🛡️ Moderation Panel` tab displaying flagged posts, report reasons, and report counts.
- [x] **Moderator Actions:**
  - `✓ Approve & Keep`: Clears flags and verifies the post.
  - `🗑️ Delete Post`: Permanently removes inappropriate content with confirmation.
- [x] **Community Groups:** Pre-seeded civic groups (Fabric Creative Hub, UPT/UVT Students, Lost Pets Network, Bega Volunteers).
- [x] **Full English Translation:** All Romanian seed text and UI prompts translated to English.

### 3. [M01_EVENTS] Cultural Micro-Events & Solana RSVPs
- [x] **Persistent Events Store (`eventsStore.ts`):** User-created events persist in `localStorage`.
- [x] **Multi-Dimensional Filters:** Filter by event category, neighborhood (Fabric, Cetate, Elisabetin, Iosefin), and audience (All, Students).
- [x] **Solana Devnet RSVP:** 1-tap RSVP mints on-chain ticket directly into the user's wallet.
- [x] **Duplicate RSVP Guard:** Detects existing tickets in the wallet and prevents redundant ticket minting.
- [x] **Map Layer View:** Toggleable interactive venue map with GPS coordinates and quick RSVP/Buddy buttons.
- [x] **Host an Event Modal:** Residents can create new micro-events (title, venue, neighborhood, price/free, description).

### 4. [M07_BUDDY] Event Companion & Social Matching
- [x] **Buddy Finder (`BuddyScreen.tsx`):** Open companion requests for events with interest matching (`🎯 95% Match`).
- [x] **Quick Event Buddy Modal (`BuddyModal.tsx`):** Launch companion search directly from any event card.
- [x] **Small Group Chat:** Real-time in-app discussion room for event attendees.
- [x] **Post a Companion Request:** Residents can broadcast requests ("Looking for 1-2 people to join").

### 5. Unified Community Navigation
- [x] **Floating Tab Bar (`TabBar.tsx`):** Direct navigation to `/(tabs)/community` via `router.navigate()`.
- [x] **Top Module Switcher:** Seamless tab navigation between `🎭 Events`, `💬 Forum`, `🤝 Buddies`, and `🎟️ Wallet`.
- [x] **Deep Linking via Query Params:** `/(tabs)/community?tab=events|forum|buddies|wallet`.

---

## 🧪 Testing Checklist (How to Test Everything)

### 1. Test Community Tab Navigation
1. Open the app on Home (`http://localhost:8081`).
2. Click **Community** in the bottom floating tab bar.
3. Verify that the Community tab opens directly into **🎭 Events**.
4. Tap each top tab pill (**🎭 Events**, **💬 Forum**, **🤝 Buddies**, **🎟️ Wallet**) to verify instant tab switching.

### 2. Test Upvotes & Duplicate Prevention (Forum)
1. Switch to **💬 Forum**.
2. On any post (e.g. *Lost Orange Tabby in Fabric*), click **`👍 Upvote`**.
3. Notice the count increments to 19 and highlights purple (`👍 Upvoted`).
4. Click it again: it toggles off to 18 (`👍 Upvote`). You can no longer spam infinite upvotes!
5. Reload the page: notice your upvote state remains saved.

### 3. Test Post Creation & Persistence
1. In **💬 Forum**, click **`+ Create Post`**.
2. Enter a title and details, select category (*Help & Questions*), and tap **Publish**.
3. Notice your new post appears at the top of the feed.
4. Reload the page: the post is still there!

### 4. Test Reporting & Moderation
1. In **💬 Forum**, click **`⚑ Report`** on *Overpriced concert tickets Piața Unirii*.
2. Notice the button updates to `⚠️ Reported`.
3. Try clicking `⚠️ Reported` again: you receive a notice saying you already reported it.
4. Tap the **`🛡️ Moderation Panel`** tab pill at the top.
5. Notice the flagged post appears with `⚠️ 4 reports` and the flag reason.
6. Click **`✓ Approve & Keep`** or **`🗑️ Delete Post`**.
7. Reload the page: the moderation change is saved!

### 5. Test Event RSVP & Duplicate Prevention
1. Switch to **🎭 Events**.
2. Notice *Underground Indie Cinema Night* already shows **`✓ Ticket Confirmed`** (disabled) because you already have a ticket in your wallet.
3. Tap **`🎟️ RSVP & Mint Ticket`** on *Beginner Pottery & Clay Jam*.
4. A Solana Devnet ticket is minted and confirmed!
5. The button updates to **`✓ Ticket Confirmed`** and is disabled.
6. Switch to the **🎟️ Wallet** tab to see your new ticket and entry QR code.

### 6. Test Door Scanner & POAP Issuance
1. In **🎟️ Wallet**, switch to the **Door Scanner** tab.
2. Select *Underground Indie Cinema Night* (or scan its QR code).
3. The door scanner verifies the ticket and mints a POAP attendance badge!
4. Click **`View POAP on Solana Explorer`** to see the transaction confirmed on Solana Devnet.

---

## 📌 Teammate Coordination
- **Person 2 (Data / Platform):** Uses Tiger Data Cloud + automatic mock fallback in `db.ts`. No local database installation needed.
- **Person 1 (Frontend Core):** Bottom tab navigation and design system intact.
