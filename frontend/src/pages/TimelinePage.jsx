import React from 'react';
import TimelineView from '../components/TimelineView';

export default function TimelinePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">2026 Launch Timeline</h2>
        <p className="text-slate-400">Orchestrating the rollout sequence</p>
      </div>
      <TimelineView />
    </div>
  );
}
