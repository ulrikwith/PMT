import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowRight, Sprout, X, Image, FileText, Mic, CheckCircle2, ExternalLink } from 'lucide-react';
import { useExploration } from '../../context/ExplorationContext';
import { useNavigate } from 'react-router-dom';

const potentialTypes = [
  { category: 'Content', options: [
    { value: 'book', label: 'Book', icon: '📚' },
    { value: 'article-series', label: 'Article Series', icon: '📝' },
    { value: 'substack', label: 'Substack Newsletter', icon: '📰' },
    { value: 'course', label: 'Online Course', icon: '🎓' },
    { value: 'podcast', label: 'Podcast', icon: '🎙️' },
    { value: 'video-series', label: 'Video Series', icon: '🎬' },
  ]},
  { category: 'Practices', options: [
    { value: 'method', label: 'Method/Framework', icon: '🧩' },
    { value: 'practice', label: 'Practice/Exercise', icon: '🧘' },
    { value: 'workshop', label: 'Workshop', icon: '🛠️' },
    { value: 'retreat', label: 'Retreat', icon: '🏔️' },
  ]},
  { category: 'Community', options: [
    { value: 'community', label: 'Community Platform', icon: '👥' },
    { value: 'circle', label: 'Circle/Group', icon: '⭕' },
    { value: 'event', label: 'Event', icon: '🎉' },
    { value: 'facilitation', label: 'Facilitation Program', icon: '🎯' },
  ]},
  { category: 'Other', options: [
    { value: 'tool', label: 'Digital Tool', icon: '🔧' },
    { value: 'custom', label: 'Custom Form', icon: '✨' },
  ]},
];

function getTypeIcon(type) {
  for (const category of potentialTypes) {
    const option = category.options.find(o => o.value === type);
    if (option) return option.icon;
  }
  return '📋';
}

function getTypeName(type) {
  for (const category of potentialTypes) {
    const option = category.options.find(o => o.value === type);
    if (option) return option.label;
  }
  return type;
}

function PotentialCard({ potential, onEdit, onDelete, onCreateWork, onViewOnBoard }) {
  const isCreated = !!potential.createdAsWorkId;

  return (
    <div className={`border rounded-xl p-5 transition-all ${
      isCreated
        ? 'border-emerald-800/40 bg-emerald-900/10 hover:border-emerald-700/50'
        : 'border-stone-800 bg-stone-900/30 hover:border-stone-700'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getTypeIcon(potential.type)}</div>
          <div>
            <h4 className="font-bold text-stone-200 flex items-center gap-2">
              {potential.name}
              {isCreated && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} />
                  Active Work
                </span>
              )}
            </h4>
            <span className="text-xs text-stone-500">{getTypeName(potential.type)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-stone-500 hover:text-[#C9A961] transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-stone-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <p className="text-sm text-stone-400 leading-relaxed mb-4">{potential.description}</p>

      {/* Visual representation */}
      {potential.visualUrl && (
        <div className="mb-4">
          {potential.visualType === 'image' && (
            <img src={potential.visualUrl} alt={potential.name} className="w-full rounded-lg" />
          )}
          {potential.visualType === 'file' && (
            <a
              href={potential.visualUrl}
              download
              className="flex items-center gap-2 text-[#C9A961] hover:underline text-sm"
            >
              <FileText size={16} />
              View {potential.fileName}
            </a>
          )}
          {potential.visualType === 'audio' && (
            <audio controls className="w-full" src={potential.visualUrl} />
          )}
        </div>
      )}

      {/* Create Work / View on Board Button */}
      {isCreated ? (
        <button
          onClick={onViewOnBoard}
          className="w-full mt-4 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-emerald-400 font-medium rounded-lg transition-all flex items-center justify-center gap-2 border border-emerald-800/30"
        >
          View on Board
          <ExternalLink size={16} />
        </button>
      ) : (
        <button
          onClick={onCreateWork}
          className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg shadow-lg hover:shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
        >
          Create as Work
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

function AddPotentialModal({ visionId, editingPotential, onClose }) {
  const { addPotential, updatePotential } = useExploration();
  const [formData, setFormData] = useState(editingPotential || {
    type: '',
    name: '',
    description: '',
    visualType: null,
    visualUrl: null,
    fileName: null,
  });
  const [file, setFile] = useState(null);

  const handleFileSelect = (visualType) => (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const reader = new window.FileReader();
      reader.onloadend = () => {
        setFile({
          name: selectedFile.name,
          type: selectedFile.type,
          data: reader.result
        });
        setFormData(prev => ({
          ...prev,
          visualType,
          visualUrl: reader.result,
          fileName: selectedFile.name
        }));
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSave = () => {
    if (editingPotential) {
      updatePotential(visionId, editingPotential.id, formData);
    } else {
      addPotential(visionId, formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1c1917] border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-stone-800 flex items-center justify-between">
          <h3 className="text-xl font-bold text-stone-200">
            {editingPotential ? 'Edit Potential Form' : 'New Potential Form'}
          </h3>
          <button onClick={onClose} className="p-2 text-stone-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-stone-400 mb-2">Form Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-stone-900/50 border border-stone-800 rounded-lg px-4 py-2 text-stone-200"
            >
              <option value="">Select type...</option>
              {potentialTypes.map(category => (
                <optgroup key={category.category} label={category.category}>
                  {category.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-400 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Inner Allies Language Framework"
              className="w-full bg-stone-900/50 border border-stone-800 rounded-lg px-4 py-2 text-stone-200 focus:outline-none focus:border-[#8B7355]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-stone-400 mb-2">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this potential form? How might it express the vision?"
              className="w-full bg-stone-900/50 border border-stone-800 rounded-lg p-4 text-stone-200 focus:outline-none focus:border-[#8B7355]"
            />
          </div>

          {/* Visual Representation */}
          <div>
            <label className="block text-sm font-medium text-stone-400 mb-2">
              Visual Representation (Optional)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect('image')}
                  className="hidden"
                />
                <div className="p-4 border-2 border-dashed border-stone-800 rounded-lg hover:border-[#8B7355] transition-colors text-center">
                  <Image size={24} className="mx-auto mb-2 text-stone-500" />
                  <span className="text-xs text-stone-500">Upload Image</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,.ppt,.pptx,.key"
                  onChange={handleFileSelect('file')}
                  className="hidden"
                />
                <div className="p-4 border-2 border-dashed border-stone-800 rounded-lg hover:border-[#8B7355] transition-colors text-center">
                  <FileText size={24} className="mx-auto mb-2 text-stone-500" />
                  <span className="text-xs text-stone-500">Upload File</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect('audio')}
                  className="hidden"
                />
                <div className="p-4 border-2 border-dashed border-stone-800 rounded-lg hover:border-[#8B7355] transition-colors text-center">
                  <Mic size={24} className="mx-auto mb-2 text-stone-500" />
                  <span className="text-xs text-stone-500">Upload Audio</span>
                </div>
              </label>
            </div>
            {formData.visualUrl && (
              <div className="mt-4">
                {formData.visualType === 'image' && (
                  <img src={formData.visualUrl} alt="Preview" className="max-w-full rounded-lg" />
                )}
                {formData.visualType === 'file' && (
                  <div className="p-3 bg-stone-900/50 border border-stone-800 rounded-lg flex items-center gap-2">
                    <FileText className="text-stone-400" />
                    <span className="text-sm text-stone-300">{formData.fileName}</span>
                  </div>
                )}
                {formData.visualType === 'audio' && (
                  <audio controls className="w-full" src={formData.visualUrl} />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-stone-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.type || !formData.name || !formData.description}
            className="px-6 py-2 bg-[#8B7355] hover:bg-[#A0826D] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingPotential ? 'Update' : 'Add'} Potential
          </button>
        </div>
      </div>
    </div>
  );
}

// Map potential types to dimensions (same as VisionWizard)
const getDimensionForType = (type) => {
  const contentTypes = ['book', 'article-series', 'substack', 'course', 'podcast', 'video-series'];
  const practiceTypes = ['method', 'practice', 'workshop', 'retreat'];
  const communityTypes = ['community', 'circle', 'event', 'facilitation'];
  if (contentTypes.includes(type)) return 'content';
  if (practiceTypes.includes(type)) return 'practice';
  if (communityTypes.includes(type)) return 'community';
  return 'content';
};

export default function PotentialsStep({ data, onCreateWork }) {
  const { deletePotential } = useExploration();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPotential, setEditingPotential] = useState(null);

  const potentials = data.potentials || [];

  const handleEdit = (potential) => {
    setEditingPotential(potential);
    setShowAddModal(true);
  };

  const handleDelete = (potentialId) => {
    if (window.confirm('Delete this potential form?')) {
      deletePotential(data.id, potentialId);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingPotential(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-stone-200 mb-2 flex items-center gap-2">
          <Sprout className="text-[#7A9B76]" size={24} />
          Potential Forms
        </h3>
        <p className="text-sm text-stone-500 leading-relaxed">
          Your vision may take many forms. These potentials can change over time. What forms are emerging?
        </p>
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        className="w-full px-4 py-3 border-2 border-dashed border-stone-800 rounded-xl text-stone-500 hover:border-[#8B7355] hover:text-[#8B7355] transition-all flex items-center justify-center gap-2 font-medium"
      >
        <Plus size={20} />
        Add Potential Form
      </button>

      {/* Potentials List */}
      {potentials.length === 0 ? (
        <div className="text-center py-12 text-stone-500 border border-stone-800 rounded-xl">
          <Sprout size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm">No potential forms yet.</p>
          <p className="text-xs mt-1">Add potential forms to explore how your vision might take shape.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {potentials.map(potential => (
            <PotentialCard
              key={potential.id}
              potential={potential}
              onEdit={() => handleEdit(potential)}
              onDelete={() => handleDelete(potential.id)}
              onCreateWork={() => onCreateWork && onCreateWork(potential)}
              onViewOnBoard={() => navigate(`/board?dimension=${getDimensionForType(potential.type)}`)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddPotentialModal
          visionId={data.id}
          editingPotential={editingPotential}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
