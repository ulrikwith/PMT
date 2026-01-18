import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import api from '../services/api';

export default function ReadinessDashboard() {
  const [readiness, setReadiness] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReadiness();
  }, []);

  const fetchReadiness = async () => {
    try {
      const data = await api.getReadiness();
      setReadiness(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load readiness data. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-slate-500">Loading readiness data...</div>;
  if (error) return <div className="text-red-500 p-4 border border-red-500/20 rounded bg-red-500/10">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Object.entries(readiness).map(([key, category]) => (
        <ReadinessCard
          key={key}
          title={category.label}
          items={category.items || []}
          requiredCount={category.items?.length || 0}
        />
      ))}
    </div>
  );
}

function ReadinessCard({ title, items, requiredCount }) {
  const completedCount = items.filter(i => i.completed).length;
  const isReady = requiredCount > 0 && completedCount >= requiredCount;

  return (
    <div className={`glass-panel rounded-xl p-6 border-2 transition-all ${
        isReady 
            ? 'border-emerald-500/30 bg-emerald-500/5 shadow-glow-green' 
            : 'border-white/5'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {isReady && (
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider">
            Ready
            </div>
        )}
      </div>
      
      <div className={`text-4xl font-bold mb-6 ${isReady ? 'text-emerald-500' : 'text-slate-500'}`}>
        {completedCount} <span className="text-xl text-slate-600 font-normal">/ {requiredCount}</span>
      </div>
      
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
              item.completed 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' 
                : 'bg-slate-800 border-slate-700 text-slate-600'
            }`}>
              {item.completed ? <Check size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>}
            </div>
            <span className={item.completed ? 'text-emerald-400' : 'text-slate-500'}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
