import React from 'react';
import ReadinessDashboard from '../components/ReadinessDashboard';

export default function ReadinessPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
          Readiness Dashboard
        </h2>
        <p className="text-slate-400">
          Tracking signals for launch
        </p>
      </div>
      <ReadinessDashboard />
    </div>
  );
}