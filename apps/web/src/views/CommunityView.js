import { fetchEvents, fetchForumPosts, fetchBuddyRequests, fetchSolanaStatus } from '../api.js';

export async function renderCommunityView() {
  const [events, posts, buddies, solana] = await Promise.all([
    fetchEvents(),
    fetchForumPosts(),
    fetchBuddyRequests(),
    fetchSolanaStatus(),
  ]);

  return `
    <div class="view-content community-view">
      
      <!-- Solana Banner -->
      <section class="solana-hero-box">
        <div class="solana-left">
          <span class="solana-pill">⚡ SOLANA DEVNET CLUSTER</span>
          <h2 class="solana-title">Bilete Culturale & Ecusoane POAP Verificabile pe Blockchain</h2>
          <p class="solana-desc">
            Evenimentele din Timișoara utilizează programul Solana SPL Memo pentru bilete de acces securizate și suveniruri digitale POAP fără costuri de gaz pentru cetățeni.
          </p>
        </div>
        <div class="solana-stats">
          <div class="solana-stat-item">
            <span class="stat-lbl">Cluster RPC:</span>
            <span class="stat-val">https://api.devnet.solana.com</span>
          </div>
          <div class="solana-stat-item">
            <span class="stat-lbl">Portofel Organizator:</span>
            <span class="stat-val"><code>H6oCfQHkpFg6rUhZmx1e6szoRveAVFrN4ji7P4HJvPU1</code></span>
          </div>
          <div class="solana-stat-item">
            <span class="stat-lbl">Stare Blockchain:</span>
            <span class="stat-val" style="color: #4ade80;">🟢 ONLINE (Slot #${solana.slot || '522113911'})</span>
          </div>
        </div>
      </section>

      <!-- Events & Forum Grid -->
      <div class="two-column-feed">
        
        <!-- Left Column: Events -->
        <div class="feed-column">
          <div class="feed-header">
            <h3>🎭 Evenimente Culturale (${events.length})</h3>
          </div>
          <div class="cards-grid">
            ${events.map(evt => `
              <div class="detail-card">
                <div class="detail-card-top">
                  <span class="provider-tag tag-colterm">${evt.category ? evt.category.toUpperCase() : 'CULTURĂ'}</span>
                  <span class="status-badge status-green">Confirmat</span>
                </div>
                <div class="detail-card-title">${evt.title}</div>
                <div class="detail-card-body">${evt.description || 'Eveniment organizat în cadrul Timișoara City Hub.'}</div>
                <div class="detail-card-footer">
                  <span>📍 ${evt.location || 'Centrul Cultural'}</span>
                  <span>📅 ${evt.date || 'În curând'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right Column: Forum & Buddies -->
        <div class="feed-column">
          
          <div class="feed-header">
            <h3>💬 Discuții Comunitare & Forum (${posts.length})</h3>
          </div>
          <div class="notice-list">
            ${posts.slice(0, 3).map(post => `
              <div class="notice-item">
                <div class="notice-top">
                  <span class="notice-provider">${post.category || 'GENERAL'}</span>
                  <span class="notice-time">${post.likes || 0} aprecieri</span>
                </div>
                <div class="notice-title">${post.title}</div>
                <div class="notice-desc">${post.content}</div>
              </div>
            `).join('')}
          </div>

          <div class="feed-header" style="margin-top: 24px;">
            <h3>🤝 Cereri Buddy Timișoara (${buddies.length})</h3>
          </div>
          <div class="notice-list">
            ${buddies.slice(0, 2).map(b => `
              <div class="notice-item">
                <div class="notice-top">
                  <span class="notice-provider banat">${b.activity_type || 'ACTIVITATE'}</span>
                  <span class="notice-time">Nivel: ${b.skill_level || 'Începător'}</span>
                </div>
                <div class="notice-title">${b.title}</div>
                <div class="notice-desc">${b.description}</div>
              </div>
            `).join('')}
          </div>

        </div>

      </div>

    </div>
  `;
}
