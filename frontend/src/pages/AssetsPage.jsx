import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Plus, Search } from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { DIMENSIONS } from '../constants/taxonomy';
import AssetCard from '../components/AssetCard';
import CreateAssetModal from '../components/CreateAssetModal';

const PHASES = [
  { id: '', label: 'All Phases' },
  { id: 'concept', label: 'Concept' },
  { id: 'development', label: 'Development' },
  { id: 'launch', label: 'Launch' },
  { id: 'growth', label: 'Growth' },
  { id: 'maturity', label: 'Maturity' },
  { id: 'decline', label: 'Decline' },
  { id: 'sunset', label: 'Sunset' },
];

const TYPES = [
  { id: '', label: 'All Types' },
  { id: 'product', label: 'Product' },
  { id: 'service', label: 'Service' },
  { id: 'offering', label: 'Offering' },
  { id: 'program', label: 'Program' },
];

export default function AssetsPage() {
  const { assets, loading, error, createAsset, updateAsset, archiveAsset, updatePhase, refreshData } = useAssets();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // Filters from URL
  const filters = {
    dimension: searchParams.get('dimension') || '',
    phase: searchParams.get('phase') || '',
    type: searchParams.get('type') || '',
    search: searchParams.get('search') || '',
  };

  // Breadcrumbs
  useEffect(() => {
    setBreadcrumbs([{ label: 'Assets', icon: Package }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  // Filter assets client-side
  const filteredAssets = assets.filter((asset) => {
    if (filters.dimension && asset.dimension !== filters.dimension) return false;
    if (filters.phase && asset.phase !== filters.phase) return false;
    if (filters.type && asset.type !== filters.type) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchName = asset.name.toLowerCase().includes(q);
      const matchDesc = (asset.description || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const handleSave = async (data, assetId) => {
    if (assetId) {
      await updateAsset(assetId, data);
    } else {
      await createAsset(data);
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingAsset(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Assets</h2>
          <p className="text-slate-400">
            {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
            {filters.dimension || filters.phase || filters.type || filters.search ? ' (filtered)' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            className="text-xs text-slate-500 hover:text-white underline"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all"
          >
            <Plus size={16} />
            New Asset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search assets..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 text-sm"
          />
        </div>

        {/* Dimension Filter */}
        <select
          value={filters.dimension}
          onChange={(e) => handleFilterChange('dimension', e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50"
        >
          <option value="">All Dimensions</option>
          {DIMENSIONS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>

        {/* Phase Filter */}
        <select
          value={filters.phase}
          onChange={(e) => handleFilterChange('phase', e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50"
        >
          {PHASES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-sm text-white focus:outline-none focus:border-blue-500/50"
        >
          {TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex justify-between items-center">
          <span>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && assets.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredAssets.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
            <Package size={28} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {filters.dimension || filters.phase || filters.type || filters.search
              ? 'No matching assets'
              : 'No assets yet'}
          </h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md">
            {filters.dimension || filters.phase || filters.type || filters.search
              ? 'Try adjusting your filters to find what you\'re looking for.'
              : 'Assets represent your products, services, offerings, and programs. Track their lifecycle from concept to sunset.'}
          </p>
          {!filters.dimension && !filters.phase && !filters.type && !filters.search && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-all"
            >
              <Plus size={16} />
              Create your first asset
            </button>
          )}
        </div>
      ) : (
        /* Asset Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onEdit={handleEdit}
              onArchive={archiveAsset}
              onUpdatePhase={updatePhase}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateAssetModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        editAsset={editingAsset}
      />
    </div>
  );
}
