import React from 'react';
import { Search, X } from 'lucide-react';

export default function FilterBar({ filters, onFilterChange }) {
  const hasActiveFilters = filters.dimension || filters.status || filters.search;

  return (
    <div className="glass-panel rounded-xl p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={filters.dimension || ''}
            onChange={(e) => onFilterChange({ ...filters, dimension: e.target.value })}
            className="flex-1 md:w-40 px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer appearance-none"
          >
            <option value="">All Dimensions</option>
            
            <optgroup label="Content">
                <option value="content">All Content</option>
                <option value="substack">Substack</option>
                <option value="newsletter">Newsletter</option>
                <option value="books">Books</option>
            </optgroup>

            <optgroup label="Practices">
                <option value="practice">All Practices</option>
                <option value="stone">Stone</option>
                <option value="walk">Walk</option>
                <option value="b2b">B2B</option>
            </optgroup>

            <optgroup label="Community">
                <option value="community">All Community</option>
                <option value="mission">Mission</option>
                <option value="development">Development</option>
                <option value="first30">First 30</option>
            </optgroup>

            <optgroup label="Marketing">
                <option value="marketing">All Marketing</option>
                <option value="bopa">BOPA</option>
                <option value="website">Website</option>
                <option value="marketing-other">Other</option>
            </optgroup>

            <optgroup label="Admin">
                <option value="admin">All Admin</option>
                <option value="planning">Planning</option>
                <option value="accounting">Accounting</option>
                <option value="admin-other">Other</option>
            </optgroup>
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="flex-1 md:w-36 px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer appearance-none"
          >
            <option value="">All Status</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
            <option value="Paused">Paused</option>
          </select>

           {hasActiveFilters && (
            <button
              onClick={() => onFilterChange({})}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
              title="Clear all filters"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
