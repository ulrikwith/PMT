import React, { useState, useEffect } from 'react';
import { Search, Flower, Cloud, HardDrive, Download, ChevronRight } from 'lucide-react';
import api from '../services/api';
import NotificationsMenu from './NotificationsMenu';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { getBreadcrumbClasses } from '../utils/colors';

export default function Header() {
  const [connectionMode, setConnectionMode] = useState('loading');
  const { breadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    let mounted = true;
    const checkConnection = async () => {
      try {
        const health = await api.getHealth();
        if (mounted) setConnectionMode(health.mode || 'local');
      } catch {
        if (mounted) setConnectionMode('offline');
      }
    };
    checkConnection();
    return () => { mounted = false; };
  }, []);

  const handleExport = () => {
    if (window.confirm('Download full project export (JSON)?')) {
      api.exportData();
    }
  };

  const isCloud = connectionMode === 'cloud';
  const isOffline = connectionMode === 'offline';

  return (
    <header className="glass-panel border-b border-white/5 px-6 py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Flower size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Inner Allies</h1>
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 text-sm">
              <ChevronRight size={16} className="text-slate-600" />
              {breadcrumbs.map((crumb, idx) => {
                const Icon = crumb.icon;
                return (
                  <React.Fragment key={idx}>
                    <div
                      className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all ${getBreadcrumbClasses(crumb.color)}`}
                    >
                      {Icon && <Icon size={14} />}
                      <span className="font-medium whitespace-nowrap">{crumb.label}</span>
                    </div>
                    {idx < breadcrumbs.length - 1 && (
                      <ChevronRight size={14} className="text-slate-700" />
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          {/* Connection Status */}
          {connectionMode !== 'loading' && breadcrumbs.length === 0 && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                isCloud
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : isOffline
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-amber-500/10 border-amber-500/20'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isCloud ? 'bg-emerald-500' : isOffline ? 'bg-red-500' : 'bg-amber-500'
                }`}
              ></div>
              {isCloud ? (
                <Cloud size={14} className="text-emerald-500" />
              ) : (
                <HardDrive size={14} className={isOffline ? 'text-red-500' : 'text-amber-500'} />
              )}
              <span
                className={`text-xs font-medium ${
                  isCloud ? 'text-emerald-500' : isOffline ? 'text-red-500' : 'text-amber-500'
                }`}
              >
                {isCloud ? 'Cloud Synced' : isOffline ? 'Offline' : 'Local Mode'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <NotificationsMenu />

          {/* Export */}
          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-lg bg-slate-800/60 border border-white/10 text-slate-400 hover:text-white hover:border-blue-500/50 transition-all flex items-center gap-2"
            title="Export Data"
          >
            <Download size={16} />
          </button>

          {/* Search */}
          <button className="px-4 py-2 rounded-lg bg-slate-800/60 border border-white/10 text-slate-400 hover:text-white hover:border-blue-500/50 transition-all">
            <Search size={16} />
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60 border border-white/10">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500"></div>
            <span className="text-sm font-medium text-slate-200">W.</span>
          </div>
        </div>
      </div>
    </header>
  );
}
