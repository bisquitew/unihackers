import React, { useState } from 'react';
import mockData from '../../shared/mockData.json';

export default function App() {
  const [activeTab, setActiveTab] = useState<'issues' | 'outages' | 'smells' | 'parkie' | 'feedback'>('issues');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-purple-900/40 bg-zinc-950/80 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8d23be] to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-900/30">
            TM
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Timișoara City Hub</h1>
            <p className="text-xs text-purple-300/80">UNIHACK 2026 • Web & Operations Portal</p>
          </div>
        </div>

        {/* Tab Controls */}
        <nav className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'issues' ? 'bg-[#8d23be] text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ReparaTM ({mockData.issues.length})
          </button>
          <button
            onClick={() => setActiveTab('outages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'outages' ? 'bg-[#8d23be] text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Outages ({mockData.outages.length})
          </button>
          <button
            onClick={() => setActiveTab('smells')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'smells' ? 'bg-[#8d23be] text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            MiroaseTM
          </button>
          <button
            onClick={() => setActiveTab('parkie')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'parkie' ? 'bg-[#8d23be] text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Parkie Lots
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'feedback' ? 'bg-[#8d23be] text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Living Labs
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'issues' && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Civic Issues Triage</h2>
                <p className="text-sm text-zinc-400">Reports submitted by residents with AI triage</p>
              </div>
              <span className="text-xs bg-purple-950/60 text-purple-300 border border-purple-800/60 px-3 py-1 rounded-full">
                Gemini Multimodal Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockData.issues.map((issue) => (
                <div key={issue.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-purple-500/40 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded-md mb-2">
                        {issue.category} • {issue.priority}
                      </span>
                      <h3 className="text-base font-semibold text-white">{issue.title}</h3>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-2">{issue.description}</p>
                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                    <span>📍 {issue.address}</span>
                    <span>👍 {issue.upvotes} upvotes</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'outages' && (
          <section>
            <h2 className="text-xl font-bold mb-4">Utility Status & Colterm Outages</h2>
            <div className="space-y-3">
              {mockData.outages.map((out) => (
                <div key={out.id} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-white">{out.utility}</h3>
                    <span className="text-xs px-2 py-1 bg-red-950/60 text-red-300 border border-red-800/50 rounded-full">{out.status}</span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-1">{out.description}</p>
                  <p className="text-xs text-zinc-400 mt-2">Area: {out.affected_area} | Reported by {out.affected_count} residents</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'parkie' && (
          <section>
            <h2 className="text-xl font-bold mb-4">Parkie Smart Parking Verification & Slot Painter</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockData.parking_lots.map((lot) => (
                <div key={lot.id} className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-white">{lot.name}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      lot.status_color === 'green' ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-amber-950/60 text-amber-300 border border-amber-800'
                    }`}>
                      {lot.available_spots}/{lot.capacity} Available
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">Verified: {lot.is_verified ? 'Yes' : 'Pending Review'}</p>
                  <button className="mt-4 w-full py-2 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50 rounded-xl text-xs font-medium transition">
                    Open Camera Frame Slot Editor Canvas
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'feedback' && (
          <section>
            <h2 className="text-xl font-bold mb-2">Living Labs Live Feedback (Vest Ventures 4.2)</h2>
            <p className="text-sm text-zinc-400 mb-6">User feedback captured live during UNIHACK testing</p>
            <div className="space-y-3">
              {mockData.living_labs_feedback.map((fb) => (
                <div key={fb.id} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl">
                  <div className="flex justify-between items-center text-xs text-zinc-400">
                    <span className="font-semibold text-purple-300">{fb.screen}</span>
                    <span>Rating: {'★'.repeat(fb.rating)}</span>
                  </div>
                  <p className="text-sm text-zinc-200 mt-2">"{fb.comment}"</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
