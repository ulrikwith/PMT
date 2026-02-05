import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DIMENSIONS } from '../constants/taxonomy';

const ASSET_TYPES = [
  { id: 'product', label: 'Product' },
  { id: 'service', label: 'Service' },
  { id: 'offering', label: 'Offering' },
  { id: 'program', label: 'Program' },
];

export default function CreateAssetModal({ isOpen, onClose, onSave, editAsset = null }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'product',
    dimension: '',
    description: '',
    purpose: '',
    audience: '',
    current_focus: '',
    next_milestone: '',
    next_milestone_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal opens/closes or editAsset changes
  useEffect(() => {
    if (isOpen) {
      if (editAsset) {
        setFormData({
          name: editAsset.name || '',
          type: editAsset.type || 'product',
          dimension: editAsset.dimension || '',
          description: editAsset.description || '',
          purpose: editAsset.purpose || '',
          audience: editAsset.audience || '',
          current_focus: editAsset.current_focus || '',
          next_milestone: editAsset.next_milestone || '',
          next_milestone_date: editAsset.next_milestone_date
            ? editAsset.next_milestone_date.split('T')[0]
            : '',
        });
      } else {
        setFormData({
          name: '',
          type: 'product',
          dimension: '',
          description: '',
          purpose: '',
          audience: '',
          current_focus: '',
          next_milestone: '',
          next_milestone_date: '',
        });
      }
      setError(null);
    }
  }, [isOpen, editAsset]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const data = {
        ...formData,
        name: formData.name.trim(),
        next_milestone_date: formData.next_milestone_date || null,
        dimension: formData.dimension || null,
      };
      await onSave(data, editAsset?.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">
            {editAsset ? 'Edit Asset' : 'Create Asset'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Stone Practice Guide"
              className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 text-sm"
              autoFocus
            />
          </div>

          {/* Type + Dimension Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 text-sm"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Dimension
              </label>
              <select
                value={formData.dimension}
                onChange={(e) => handleChange('dimension', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 text-sm"
              >
                <option value="">None</option>
                {DIMENSIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="What is this asset?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 text-sm resize-none"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Purpose
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              placeholder="Why does this asset exist?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 text-sm resize-none"
            />
          </div>

          {/* Audience */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Audience
            </label>
            <textarea
              value={formData.audience}
              onChange={(e) => handleChange('audience', e.target.value)}
              placeholder="Who is this for?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 text-sm resize-none"
            />
          </div>

          {/* Current Focus */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Current Focus
            </label>
            <input
              type="text"
              value={formData.current_focus}
              onChange={(e) => handleChange('current_focus', e.target.value)}
              placeholder="What are you working on right now?"
              className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 text-sm"
            />
          </div>

          {/* Next Milestone + Date Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Next Milestone
              </label>
              <input
                type="text"
                value={formData.next_milestone}
                onChange={(e) => handleChange('next_milestone', e.target.value)}
                placeholder="e.g., Beta launch"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Target Date
              </label>
              <input
                type="date"
                value={formData.next_milestone_date}
                onChange={(e) => handleChange('next_milestone_date', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : editAsset ? 'Save Changes' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
