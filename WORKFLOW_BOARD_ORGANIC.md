# Workflow Board - Organic Work Creation Canvas
## React Flow-Powered Visual Project Builder

---

## Core Philosophy

> "The Workflow Board is NOT a visualization of existing structure. It's WHERE you BUILD your project organically by creating Works, defining their activities, and connecting them together. Works created here become the foundation of your entire project management system."

**Key Principle:** Work-first creation, not structure-first organization.

---

## System Overview

### The Creation Flow

```
1. Open Workflow Board (Content dimension) → See one empty Work node
2. Click Work node → Side panel wizard opens
3. Define Work (name, element, resources) → Work node updates
4. Add Activities → Child nodes appear connected to Work
5. Create another Work → Drag to connect → Define relationship
6. Repeat organically → Build your project visually
7. Works automatically sync to "All Tasks" list view
```

### Five Separate Canvases

```
📘 Content Board      → Books, Substack, Newsletter, Stone
🧘 Practices Board    → Walk, Stone practice, Two-Loop Method
👥 Community Board    → Discord, Events, Facilitators
📢 Marketing Board    → BOPA, Website, Outreach
⚙️ Admin Board        → Accounting, Planning, Operations
```

Each board is completely independent with its own set of Works.

---

## Technical Setup

### React Flow Installation

```bash
npm install reactflow
npm install @reactflow/node-resizer @reactflow/background @reactflow/controls @reactflow/minimap
npm install dagre  # For auto-layout
```

### Basic Imports

```javascript
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  NodeResizer,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
```

---

## Component Architecture

### Main Workflow Board Component

```jsx
// src/pages/WorkflowBoard.jsx
import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import WorkNode from '../components/WorkflowBoard/WorkNode';
import ActivityNode from '../components/WorkflowBoard/ActivityNode';
import WorkWizardPanel from '../components/WorkflowBoard/WorkWizardPanel';
import ConnectionModal from '../components/WorkflowBoard/ConnectionModal';
import DimensionTabs from '../components/WorkflowBoard/DimensionTabs';

const nodeTypes = {
  work: WorkNode,
  activity: ActivityNode,
};

export default function WorkflowBoard() {
  const [activeDimension, setActiveDimension] = useState('content');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [connectionModal, setConnectionModal] = useState(null);

  // Initialize with one empty Work node on first load
  React.useEffect(() => {
    if (nodes.length === 0) {
      const initialNode = {
        id: 'work-1',
        type: 'work',
        position: { x: 400, y: 300 },
        data: {
          label: 'New Work',
          status: 'empty',
          element: null,
          dimension: activeDimension,
          activities: [],
          resources: {},
        },
      };
      setNodes([initialNode]);
    }
  }, []);

  // Handle node click → Open wizard
  const onNodeClick = useCallback((event, node) => {
    if (node.type === 'work') {
      setSelectedNode(node);
      setWizardOpen(true);
    }
  }, []);

  // Handle connection creation → Show modal
  const onConnect = useCallback((params) => {
    setConnectionModal(params);
  }, []);

  // Add new Work node
  const addNewWork = useCallback(() => {
    const newId = `work-${Date.now()}`;
    const newNode = {
      id: newId,
      type: 'work',
      position: { x: Math.random() * 500 + 200, y: Math.random() * 400 + 200 },
      data: {
        label: 'New Work',
        status: 'empty',
        element: null,
        dimension: activeDimension,
        activities: [],
        resources: {},
      },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [activeDimension]);

  // Add activities as child nodes
  const addActivitiesToWork = useCallback((workId, activities) => {
    const workNode = nodes.find((n) => n.id === workId);
    if (!workNode) return;

    // Create activity nodes positioned below parent
    const activityNodes = activities.map((activity, index) => ({
      id: `${workId}-activity-${index}`,
      type: 'activity',
      position: {
        x: workNode.position.x + (index - activities.length / 2) * 150,
        y: workNode.position.y + 150,
      },
      data: {
        label: activity.title,
        status: activity.status || 'todo',
        timeEstimate: activity.timeEstimate,
        parentWorkId: workId,
      },
    }));

    // Create edges connecting activities to work
    const activityEdges = activityNodes.map((node) => ({
      id: `edge-${workId}-${node.id}`,
      source: workId,
      target: node.id,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#475569', strokeWidth: 2 },
    }));

    setNodes((nds) => [...nds, ...activityNodes]);
    setEdges((eds) => [...eds, ...activityEdges]);
  }, [nodes]);

  // Auto-layout using dagre
  const onLayout = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', ranksep: 150, nodesep: 100 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 250, height: 100 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 125,
          y: nodeWithPosition.y - 50,
        },
      };
    });

    setNodes(layoutedNodes);
  }, [nodes, edges]);

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Top Navigation with Dimension Tabs */}
      <DimensionTabs
        activeDimension={activeDimension}
        onDimensionChange={(dim) => {
          setActiveDimension(dim);
          // Load nodes for this dimension
        }}
      />

      {/* React Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-950"
        >
          <Background color="#1e293b" gap={16} />
          <Controls className="bg-slate-800/60 border border-white/10 rounded-lg" />
          <MiniMap
            className="bg-slate-900/60 border border-white/10 rounded-lg"
            nodeColor={(node) => {
              if (node.type === 'work') return '#3B82F6';
              return '#64748B';
            }}
          />

          {/* Floating Action Panel */}
          <Panel position="top-right" className="space-y-2">
            <button
              onClick={addNewWork}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Add Work
            </button>
            
            <button
              onClick={onLayout}
              className="px-4 py-2 bg-slate-800/60 border border-white/10 text-slate-300 font-medium rounded-lg hover:border-blue-500/50 transition-all flex items-center gap-2"
            >
              <LayoutGrid size={18} />
              Auto Layout
            </button>
          </Panel>
        </ReactFlow>

        {/* Side Panel - Work Wizard */}
        {wizardOpen && (
          <WorkWizardPanel
            node={selectedNode}
            onClose={() => setWizardOpen(false)}
            onSave={(updatedData) => {
              // Update node data
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === selectedNode.id
                    ? { ...n, data: { ...n.data, ...updatedData } }
                    : n
                )
              );
              
              // Add activities as child nodes
              if (updatedData.activities?.length > 0) {
                addActivitiesToWork(selectedNode.id, updatedData.activities);
              }
              
              setWizardOpen(false);
            }}
          />
        )}

        {/* Connection Modal */}
        {connectionModal && (
          <ConnectionModal
            connection={connectionModal}
            onConfirm={(connectionType, label) => {
              const newEdge = {
                ...connectionModal,
                type: 'smoothstep',
                animated: connectionType === 'feeds-into',
                label: label,
                style: {
                  stroke: getConnectionColor(connectionType),
                  strokeWidth: 2,
                },
                markerEnd: {
                  type: 'arrowclosed',
                  color: getConnectionColor(connectionType),
                },
                data: { type: connectionType, label },
              };
              setEdges((eds) => addEdge(newEdge, eds));
              setConnectionModal(null);
            }}
            onCancel={() => setConnectionModal(null)}
          />
        )}
      </div>
    </div>
  );
}

function getConnectionColor(type) {
  const colors = {
    'feeds-into': '#3B82F6',
    'comes-from': '#10B981',
    'related-to': '#8B5CF6',
    'blocks': '#F59E0B',
  };
  return colors[type] || '#94A3B8';
}
```

---

## Custom Node Components

### Work Node

```jsx
// src/components/WorkflowBoard/WorkNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Book, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function WorkNode({ data, selected }) {
  const isEmpty = data.status === 'empty';
  const isComplete = data.status === 'complete';
  
  return (
    <div
      className={`
        glass-panel rounded-xl p-4 w-64 border-2 transition-all
        ${selected ? 'border-blue-500 shadow-lg shadow-blue-500/30' : 'border-white/10'}
        ${isEmpty ? 'border-dashed border-slate-700' : ''}
        hover:border-blue-500/50 cursor-pointer
      `}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500 border-2 border-white/20"
      />

      {/* Work Content */}
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEmpty ? (
              <div className="text-slate-500 text-sm">
                Click to define this Work
              </div>
            ) : (
              <>
                <h3 className="text-white font-semibold leading-tight mb-1">
                  {data.label}
                </h3>
                {data.element && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className={`w-2 h-2 rounded-full ${getDimensionColor(data.dimension)}`}></div>
                    <span>{data.element}</span>
                  </div>
                )}
              </>
            )}
          </div>
          
          {!isEmpty && (
            <div className="flex-shrink-0">
              {isComplete ? (
                <CheckCircle size={20} className="text-emerald-500" />
              ) : (
                <Clock size={20} className="text-orange-500" />
              )}
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {!isEmpty && data.activities && data.activities.length > 0 && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Activities</span>
              <span>
                {data.activities.filter(a => a.status === 'done').length} / {data.activities.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                style={{
                  width: `${(data.activities.filter(a => a.status === 'done').length / data.activities.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Resources Summary */}
        {!isEmpty && data.resources && (
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {data.resources.timeEstimate && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {data.resources.timeEstimate}h
              </span>
            )}
            {data.resources.tools && data.resources.tools.length > 0 && (
              <span className="flex items-center gap-1">
                <Book size={12} />
                {data.resources.tools.length} tools
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500 border-2 border-white/20"
      />
    </div>
  );
}

function getDimensionColor(dimension) {
  const colors = {
    content: 'bg-blue-500',
    practices: 'bg-emerald-500',
    community: 'bg-pink-500',
    marketing: 'bg-amber-500',
    admin: 'bg-purple-500',
  };
  return colors[dimension] || 'bg-slate-500';
}
```

### Activity Node

```jsx
// src/components/WorkflowBoard/ActivityNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Check, Circle, Clock } from 'lucide-react';

export default function ActivityNode({ data, selected }) {
  const isDone = data.status === 'done';
  const isInProgress = data.status === 'in-progress';
  
  return (
    <div
      className={`
        glass-panel rounded-lg p-3 w-48 border transition-all
        ${selected ? 'border-blue-500' : 'border-white/5'}
        ${isDone ? 'bg-emerald-500/5 border-emerald-500/20' : ''}
        ${isInProgress ? 'bg-blue-500/5 border-blue-500/20' : ''}
        hover:border-blue-500/50 cursor-pointer
      `}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-slate-500 border border-white/20"
      />

      {/* Activity Content */}
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          {isDone ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Check size={12} className="text-emerald-500" />
            </div>
          ) : isInProgress ? (
            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Clock size={12} className="text-blue-500 animate-pulse" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-700/30 border border-slate-700/30 flex items-center justify-center">
              <Circle size={12} className="text-slate-500" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">
            {data.label}
          </p>
          {data.timeEstimate && (
            <p className="text-xs text-slate-500 mt-0.5">
              {data.timeEstimate}h
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Work Wizard Side Panel

```jsx
// src/components/WorkflowBoard/WorkWizardPanel.jsx
import React, { useState } from 'react';
import { X, Plus, Trash2, Clock, Wrench, Users, BookOpen } from 'lucide-react';

export default function WorkWizardPanel({ node, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [workData, setWorkData] = useState({
    label: node.data.label || '',
    description: '',
    element: node.data.element || '',
    dimension: node.data.dimension || '',
    workType: 'part-of-element',
    targetOutcome: '',
    startDate: '',
    targetCompletion: '',
    activities: node.data.activities || [],
    resources: node.data.resources || {
      timeEstimate: '',
      energyLevel: 'focused',
      tools: [],
      materials: '',
      people: [],
      notes: '',
    },
  });

  const handleSave = () => {
    onSave(workData);
  };

  return (
    <div className="absolute top-0 right-0 w-[480px] h-full glass-panel border-l border-white/5 shadow-2xl transform translate-x-0 transition-transform duration-300 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {node.data.status === 'empty' ? 'Define Work' : 'Edit Work'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">Step {step} of 4</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-all ${
                s <= step ? 'bg-blue-500' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-medium">
          <span className={step >= 1 ? 'text-blue-500' : 'text-slate-500'}>Define</span>
          <span className={step >= 2 ? 'text-blue-500' : 'text-slate-500'}>Activities</span>
          <span className={step >= 3 ? 'text-blue-500' : 'text-slate-500'}>Resources</span>
          <span className={step >= 4 ? 'text-blue-500' : 'text-slate-500'}>Review</span>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* STEP 1: Define Work */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Work Name *
              </label>
              <input
                type="text"
                value={workData.label}
                onChange={(e) => setWorkData({ ...workData, label: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                placeholder="e.g., Chapter 12: The Body as Classroom"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={workData.description}
                onChange={(e) => setWorkData({ ...workData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
                rows={3}
                placeholder="What is this Work about?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Element *
              </label>
              <select
                value={workData.element}
                onChange={(e) => setWorkData({ ...workData, element: e.target.value })}
                className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              >
                <option value="">Select Element...</option>
                {getElementsForDimension(workData.dimension).map((el) => (
                  <option key={el} value={el}>{el}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Work Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWorkData({ ...workData, workType: 'complete-element' })}
                  className={`glass-panel p-4 rounded-lg transition-all text-left ${
                    workData.workType === 'complete-element'
                      ? 'border-2 border-blue-500 bg-blue-500/5'
                      : 'border border-white/10 hover:border-blue-500/50'
                  }`}
                >
                  <div className="text-sm font-semibold text-white mb-1">Complete Element</div>
                  <p className="text-xs text-slate-400">This Work IS the Element</p>
                </button>

                <button
                  onClick={() => setWorkData({ ...workData, workType: 'part-of-element' })}
                  className={`glass-panel p-4 rounded-lg transition-all text-left ${
                    workData.workType === 'part-of-element'
                      ? 'border-2 border-blue-500 bg-blue-500/5'
                      : 'border border-white/10 hover:border-blue-500/50'
                  }`}
                >
                  <div className="text-sm font-semibold text-white mb-1">Part of Element</div>
                  <p className="text-xs text-slate-400">One piece of the Element</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={workData.startDate}
                  onChange={(e) => setWorkData({ ...workData, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target Completion
                </label>
                <input
                  type="date"
                  value={workData.targetCompletion}
                  onChange={(e) => setWorkData({ ...workData, targetCompletion: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Activities */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Activities</h3>
              <button
                onClick={() => {
                  setWorkData({
                    ...workData,
                    activities: [
                      ...workData.activities,
                      { id: Date.now(), title: '', timeEstimate: '', status: 'todo' },
                    ],
                  });
                }}
                className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-all flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Add Activity
              </button>
            </div>

            <div className="space-y-3">
              {workData.activities.map((activity, index) => (
                <div key={activity.id} className="glass-panel rounded-lg p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-700/30 border border-slate-700/30 text-slate-400 font-semibold text-sm flex-shrink-0 mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={activity.title}
                        onChange={(e) => {
                          const updated = [...workData.activities];
                          updated[index].title = e.target.value;
                          setWorkData({ ...workData, activities: updated });
                        }}
                        className="w-full bg-transparent border-none text-white font-medium focus:outline-none placeholder-slate-500"
                        placeholder="Activity name..."
                      />
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={activity.timeEstimate}
                          onChange={(e) => {
                            const updated = [...workData.activities];
                            updated[index].timeEstimate = e.target.value;
                            setWorkData({ ...workData, activities: updated });
                          }}
                          className="w-24 px-3 py-1.5 bg-slate-900/60 border border-white/10 rounded text-sm text-white focus:border-blue-500/50 focus:outline-none"
                          placeholder="Hours"
                        />
                        <span className="text-xs text-slate-500">hours</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setWorkData({
                          ...workData,
                          activities: workData.activities.filter((_, i) => i !== index),
                        });
                      }}
                      className="p-1 rounded text-slate-500 hover:text-red-500 transition-colors mt-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {workData.activities.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No activities yet. Click "Add Activity" to start.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Resources */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">Resources Needed</h3>

            {/* Time & Energy */}
            <div className="glass-panel rounded-xl p-5 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-blue-500" size={20} />
                <h4 className="text-sm font-semibold text-white">Time & Energy</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Total Hours
                  </label>
                  <input
                    type="number"
                    value={workData.resources.timeEstimate}
                    onChange={(e) =>
                      setWorkData({
                        ...workData,
                        resources: { ...workData.resources, timeEstimate: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Energy Level
                  </label>
                  <select
                    value={workData.resources.energyLevel}
                    onChange={(e) =>
                      setWorkData({
                        ...workData,
                        resources: { ...workData.resources, energyLevel: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:outline-none"
                  >
                    <option value="deep">Deep work</option>
                    <option value="focused">Focused work</option>
                    <option value="light">Light work</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tools */}
            <div className="glass-panel rounded-xl p-5 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Wrench className="text-purple-500" size={20} />
                <h4 className="text-sm font-semibold text-white">Tools & Software</h4>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {workData.resources.tools?.map((tool, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-medium text-purple-500 flex items-center gap-2"
                    >
                      {tool}
                      <button
                        onClick={() => {
                          const updated = workData.resources.tools.filter((_, i) => i !== index);
                          setWorkData({
                            ...workData,
                            resources: { ...workData.resources, tools: updated },
                          });
                        }}
                      >
                        <X size={12} className="cursor-pointer hover:text-purple-300" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      setWorkData({
                        ...workData,
                        resources: {
                          ...workData.resources,
                          tools: [...(workData.resources.tools || []), e.target.value.trim()],
                        },
                      });
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none"
                  placeholder="Type tool name and press Enter..."
                />
              </div>
            </div>

            {/* Materials */}
            <div className="glass-panel rounded-xl p-5 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="text-emerald-500" size={20} />
                <h4 className="text-sm font-semibold text-white">Research Materials</h4>
              </div>
              <textarea
                value={workData.resources.materials}
                onChange={(e) =>
                  setWorkData({
                    ...workData,
                    resources: { ...workData.resources, materials: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none resize-none"
                rows={3}
                placeholder="What sources, books, notes, or materials do you need?"
              />
            </div>

            {/* People */}
            <div className="glass-panel rounded-xl p-5 border border-amber-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Users className="text-amber-500" size={20} />
                <h4 className="text-sm font-semibold text-white">People & Collaborators</h4>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {workData.resources.people?.map((person, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-medium text-amber-500 flex items-center gap-2"
                    >
                      {person}
                      <button
                        onClick={() => {
                          const updated = workData.resources.people.filter((_, i) => i !== index);
                          setWorkData({
                            ...workData,
                            resources: { ...workData.resources, people: updated },
                          });
                        }}
                      >
                        <X size={12} className="cursor-pointer hover:text-amber-300" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      setWorkData({
                        ...workData,
                        resources: {
                          ...workData.resources,
                          people: [...(workData.resources.people || []), e.target.value.trim()],
                        },
                      });
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-amber-500/50 focus:outline-none"
                  placeholder="Type name and press Enter..."
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review */}
        {step === 4 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-white">Review Work</h3>

            <div className="glass-panel rounded-xl p-5 space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Work Name
                </div>
                <div className="text-white font-semibold">{workData.label}</div>
              </div>

              {workData.description && (
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Description
                  </div>
                  <div className="text-slate-300 text-sm">{workData.description}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Element
                  </div>
                  <div className="text-white">{workData.element || 'Not set'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Work Type
                  </div>
                  <div className="text-white">
                    {workData.workType === 'complete-element' ? 'Complete Element' : 'Part of Element'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Activities ({workData.activities.length})
                </div>
                <div className="space-y-1">
                  {workData.activities.map((activity, index) => (
                    <div key={activity.id} className="text-sm text-slate-300 flex items-center gap-2">
                      <span className="text-slate-600">{index + 1}.</span>
                      <span>{activity.title}</span>
                      {activity.timeEstimate && (
                        <span className="text-xs text-slate-500">({activity.timeEstimate}h)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {workData.resources.timeEstimate && (
                <div>
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Total Time
                  </div>
                  <div className="text-white">
                    {workData.resources.timeEstimate} hours • {workData.resources.energyLevel} work
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-400">
                This Work will be added to your canvas and activities will appear as connected nodes.
                It will also sync to your "All Tasks" list view.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-6 border-t border-white/5 flex justify-between">
        <button
          onClick={() => {
            if (step > 1) setStep(step - 1);
            else onClose();
          }}
          className="px-6 py-2.5 text-slate-400 font-medium rounded-lg hover:text-white hover:bg-slate-800/40 transition-all"
        >
          {step === 1 ? 'Cancel' : '← Back'}
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && (!workData.label || !workData.element)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
          >
            Save Work ✓
          </button>
        )}
      </div>
    </div>
  );
}

function getElementsForDimension(dimension) {
  const elements = {
    content: ['Books', 'Substack', 'Newsletter', 'Stone', 'Other'],
    practices: ['Walk', 'Stone', 'B2B', 'Other'],
    community: ['BOPA', 'Website', 'Other'],
    marketing: ['First 30', 'Planning', 'Other'],
    admin: ['Accounting', 'Development', 'Mission', 'Other'],
  };
  return elements[dimension] || [];
}
```

---

## Connection Modal

```jsx
// src/components/WorkflowBoard/ConnectionModal.jsx
import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, ArrowLeftRight, Lock } from 'lucide-react';

const CONNECTION_TYPES = [
  {
    id: 'feeds-into',
    icon: ArrowRight,
    label: 'Feeds Into',
    color: '#3B82F6',
    description: 'This Work flows into the connected Work',
  },
  {
    id: 'comes-from',
    icon: ArrowLeft,
    label: 'Comes From',
    color: '#10B981',
    description: 'This Work is built from the connected Work',
  },
  {
    id: 'related-to',
    icon: ArrowLeftRight,
    label: 'Related To',
    color: '#8B5CF6',
    description: 'Bidirectional relationship',
  },
  {
    id: 'blocks',
    icon: Lock,
    label: 'Blocks',
    color: '#F59E0B',
    description: 'This Work blocks the other from proceeding',
  },
];

export default function ConnectionModal({ connection, onConfirm, onCancel }) {
  const [selectedType, setSelectedType] = useState('feeds-into');
  const [label, setLabel] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-panel rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Define Connection</h2>
        <p className="text-sm text-slate-400 mb-6">
          How do these Works relate to each other?
        </p>

        {/* Connection Type Selection */}
        <div className="space-y-3 mb-6">
          {CONNECTION_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`w-full glass-panel rounded-lg p-4 border-2 transition-all text-left ${
                  selectedType === type.id
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${type.color}20`, border: `1px solid ${type.color}40` }}
                  >
                    <Icon size={20} style={{ color: type.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{type.label}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{type.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Optional Label */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Connection Label (Optional)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            placeholder="e.g., 'in 2-3 weeks'"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-slate-800/60 border border-white/10 text-slate-300 font-medium rounded-lg hover:border-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedType, label)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
          >
            Create Connection
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Dimension Tabs Component

```jsx
// src/components/WorkflowBoard/DimensionTabs.jsx
import React from 'react';
import { Book, User, Users, Megaphone, Settings } from 'lucide-react';

const DIMENSIONS = [
  { id: 'content', label: 'Content', icon: Book, color: 'blue' },
  { id: 'practices', label: 'Practices', icon: User, color: 'emerald' },
  { id: 'community', label: 'Community', icon: Users, color: 'pink' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'amber' },
  { id: 'admin', label: 'Admin', icon: Settings, color: 'purple' },
];

export default function DimensionTabs({ activeDimension, onDimensionChange }) {
  return (
    <div className="glass-panel border-b border-white/5 px-6 py-3">
      <div className="flex items-center gap-2">
        {DIMENSIONS.map((dim) => {
          const Icon = dim.icon;
          const isActive = activeDimension === dim.id;
          
          return (
            <button
              key={dim.id}
              onClick={() => onDimensionChange(dim.id)}
              className={`
                px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2
                ${isActive
                  ? `bg-${dim.color}-500/10 border-2 border-${dim.color}-500/30 text-${dim.color}-500`
                  : 'bg-slate-800/40 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }
              `}
              style={isActive ? {
                backgroundColor: `var(--dimension-${dim.id}-bg)`,
                borderColor: `var(--dimension-${dim.id}-border)`,
                color: `var(--dimension-${dim.id}-text)`,
              } : {}}
            >
              <Icon size={16} />
              {dim.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Data Sync to Blue.cc

### Saving Work to Backend

```javascript
// src/utils/workflowSync.js
import axios from 'axios';

export async function saveWorkToBackend(work) {
  try {
    // Create the Work as a container task
    const workTask = await axios.post('http://localhost:3001/api/tasks', {
      title: work.label,
      description: work.description,
      status: 'In Progress',
      tags: [work.dimension, work.element],
      metadata: {
        workType: work.workType,
        targetOutcome: work.targetOutcome,
        startDate: work.startDate,
        targetCompletion: work.targetCompletion,
        resources: work.resources,
        isWorkNode: true, // Flag to identify Work nodes
      },
    });

    // Create activities as child tasks
    const activityPromises = work.activities.map((activity) =>
      axios.post('http://localhost:3001/api/tasks', {
        title: activity.title,
        description: `Activity for ${work.label}`,
        status: activity.status === 'done' ? 'Done' : 'In Progress',
        tags: [work.dimension, work.element, 'activity'],
        metadata: {
          parentWorkId: workTask.data.id,
          timeEstimate: activity.timeEstimate,
          isActivityNode: true,
        },
      })
    );

    await Promise.all(activityPromises);

    return workTask.data;
  } catch (error) {
    console.error('Error saving work to backend:', error);
    throw error;
  }
}

export async function saveConnectionToBackend(connection) {
  try {
    await axios.post('http://localhost:3001/api/relationships', {
      fromTaskId: connection.source,
      toTaskId: connection.target,
      type: connection.data.type,
      description: connection.label,
    });
  } catch (error) {
    console.error('Error saving connection to backend:', error);
    throw error;
  }
}

export async function loadWorksFromBackend(dimension) {
  try {
    const response = await axios.get(`http://localhost:3001/api/tasks?dimension=${dimension}&isWorkNode=true`);
    
    // Transform tasks back to Work nodes
    const works = response.data.map((task) => ({
      id: task.id,
      type: 'work',
      position: task.metadata.position || { x: 0, y: 0 }, // Store position in metadata
      data: {
        label: task.title,
        description: task.description,
        element: task.tags.find((t) => t !== dimension),
        dimension: dimension,
        status: task.status === 'Done' ? 'complete' : 'in-progress',
        activities: [], // Load separately
        resources: task.metadata.resources || {},
      },
    }));

    return works;
  } catch (error) {
    console.error('Error loading works from backend:', error);
    return [];
  }
}
```

### Auto-save Hook

```javascript
// src/hooks/useWorkflowAutoSave.js
import { useEffect, useRef } from 'react';
import { saveWorkToBackend, saveConnectionToBackend } from '../utils/workflowSync';

export function useWorkflowAutoSave(nodes, edges, dimension) {
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for 2 seconds after last change
    saveTimeoutRef.current = setTimeout(async () => {
      console.log('Auto-saving workflow...');
      
      // Save each Work node
      for (const node of nodes) {
        if (node.type === 'work' && node.data.status !== 'empty') {
          await saveWorkToBackend({
            ...node.data,
            id: node.id,
            position: node.position,
          });
        }
      }

      // Save connections
      for (const edge of edges) {
        await saveConnectionToBackend(edge);
      }

      console.log('Auto-save complete');
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [nodes, edges, dimension]);
}
```

---

## Integration with "All Tasks" List View

### Backend: Flatten Works to Tasks

```javascript
// backend/routes/tasks.js
app.get('/api/tasks', async (req, res) => {
  try {
    const { dimension, flatView } = req.query;
    
    // Get all tasks
    const allTasks = await blueClient.getTasks();
    
    if (flatView === 'true') {
      // Flatten: Show both Work containers and Activities
      const flatTasks = allTasks.map((task) => {
        if (task.metadata?.isWorkNode) {
          return {
            ...task,
            displayName: `📦 ${task.title}`, // Prefix for Work nodes
          };
        } else if (task.metadata?.isActivityNode) {
          return {
            ...task,
            displayName: `  ↳ ${task.title}`, // Indent for activities
          };
        }
        return task;
      });
      
      return res.json(flatTasks);
    }
    
    // Regular task list
    res.json(allTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend: Task List View

```jsx
// src/pages/TaskList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight } from 'lucide-react';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [showWorkNodes, setShowWorkNodes] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, [showWorkNodes]);

  async function fetchTasks() {
    const response = await fetch(`http://localhost:3001/api/tasks?flatView=${showWorkNodes}`);
    const data = await response.json();
    setTasks(data);
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">All Tasks</h1>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showWorkNodes}
              onChange={(e) => setShowWorkNodes(e.target.checked)}
              className="rounded"
            />
            Show Work structure
          </label>
          
          <Link
            to="/board"
            className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-all flex items-center gap-2"
          >
            <Package size={16} />
            Open Workflow Board
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const isWork = task.metadata?.isWorkNode;
          const isActivity = task.metadata?.isActivityNode;
          
          return (
            <div
              key={task.id}
              className={`
                glass-panel rounded-lg p-4 transition-all
                ${isWork ? 'border-2 border-blue-500/20 bg-blue-500/5' : ''}
                ${isActivity ? 'ml-8 border-l-2 border-slate-700' : ''}
                hover:border-blue-500/50
              `}
            >
              <div className="flex items-start gap-3">
                {isWork && <Package size={18} className="text-blue-500 mt-0.5" />}
                {isActivity && <ArrowRight size={18} className="text-slate-600 mt-0.5" />}
                
                <div className="flex-1">
                  <h3 className="text-white font-medium">{task.displayName || task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {task.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-slate-800/60 border border-white/10 rounded text-xs text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Complete File Structure

```
PMT/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── WorkflowBoard.jsx         # Main canvas
│   │   │   └── TaskList.jsx              # List view with Work hierarchy
│   │   ├── components/
│   │   │   └── WorkflowBoard/
│   │   │       ├── WorkNode.jsx          # Custom Work node
│   │   │       ├── ActivityNode.jsx      # Custom Activity node
│   │   │       ├── WorkWizardPanel.jsx   # Side panel wizard
│   │   │       ├── ConnectionModal.jsx   # Connection type selector
│   │   │       └── DimensionTabs.jsx     # Dimension switcher
│   │   ├── hooks/
│   │   │   └── useWorkflowAutoSave.js   # Auto-save hook
│   │   ├── utils/
│   │   │   └── workflowSync.js          # Backend sync functions
│   │   └── App.jsx
│   ├── package.json                      # Add reactflow dependency
│   └── ...
│
├── backend/
│   ├── routes/
│   │   ├── tasks.js                      # Enhanced with Work/Activity flags
│   │   └── relationships.js              # Connection storage
│   └── ...
│
└── docs/
    ├── PROJECT_PLAN_V1.md
    ├── UI_DESIGN_SYSTEM.md
    └── WORKFLOW_BOARD_ORGANIC.md         # This file
```

---

## Implementation Checklist

**Phase 1: React Flow Setup (Day 1-2)**
- [ ] Install React Flow and dependencies
- [ ] Create basic WorkflowBoard page with empty canvas
- [ ] Add DimensionTabs component
- [ ] Implement one empty Work node on initialization

**Phase 2: Custom Nodes (Day 3-4)**
- [ ] Create WorkNode component with glass morphism styling
- [ ] Create ActivityNode component
- [ ] Add node click handlers
- [ ] Test dragging and positioning

**Phase 3: Work Wizard (Day 5-7)**
- [ ] Build 4-step WorkWizardPanel component
- [ ] Implement side panel slide-in animation
- [ ] Connect wizard to node data updates
- [ ] Add validation and error handling

**Phase 4: Activity Nodes (Day 8-9)**
- [ ] Generate activity nodes from Work wizard
- [ ] Position activities below parent Work
- [ ] Create edges connecting activities to Work
- [ ] Style activity nodes by status

**Phase 5: Connections (Day 10-11)**
- [ ] Implement ConnectionModal
- [ ] Add connection type selection
- [ ] Style edges by connection type
- [ ] Add connection labels

**Phase 6: Auto-layout (Day 12)**
- [ ] Install and configure dagre
- [ ] Implement layout algorithm
- [ ] Add "Auto Layout" button
- [ ] Fine-tune spacing and positioning

**Phase 7: Backend Sync (Day 13-14)**
- [ ] Create workflowSync utilities
- [ ] Implement auto-save hook
- [ ] Save Works and Activities to Blue.cc
- [ ] Save connections to relationships table
- [ ] Load Works from backend on dimension switch

**Phase 8: Task List Integration (Day 15)**
- [ ] Enhance Task List to show Work hierarchy
- [ ] Add "Show Work structure" toggle
- [ ] Link between Board and List views
- [ ] Ensure bi-directional sync

**Phase 9: Polish & Testing (Day 16-17)**
- [ ] Add keyboard shortcuts
- [ ] Improve animations
- [ ] Test all 5 dimension boards
- [ ] Test Work creation flow end-to-end
- [ ] Test sync between Board and List
- [ ] Mobile responsiveness

---

## Key Differences from Previous Spec

| Previous (Wrong) | Current (Correct) |
|-----------------|-------------------|
| Static visualization of structure | Dynamic creation canvas |
| Pre-defined Element nodes | Elements selected from dropdown |
| Works displayed after creation elsewhere | Works created directly on canvas |
| Fixed hierarchy display | Organic, user-defined layout |
| Decoration tool | Core project management tool |

---

## Success Criteria

✅ Opening Content board shows one empty Work node
✅ Clicking Work opens wizard in side panel
✅ Completing wizard updates Work node with details
✅ Activities appear as child nodes below Work
✅ Can drag Works to position them organically
✅ Can connect Works with typed arrows
✅ Works automatically appear in "All Tasks" list
✅ Editing in List updates Board, and vice versa
✅ Auto-layout button organizes nodes cleanly
✅ Five separate dimension boards work independently

---

**This is the organic, Work-first creation system you envisioned. Build your project visually, then it becomes structured data automatically.** 🎨→📊



✅ Complete Organic Workflow Board Specification Created!
I've completely redesigned the system based on your clarifications. This is now the CORRECT specification!
What Changed (The Fundamental Shift):
BEFORE (Wrong):

Visualization tool showing pre-built structure ❌
Fixed hierarchy: Dimension → Element → Work
Static display of what you created elsewhere
Decoration, not creation

NOW (Correct):

Creation canvas where you BUILD your project ✅
Start blank → Create Works → Define them → Connect them
The mind map IS the project management tool
Works created HERE, then sync everywhere

The Core Innovation:
1. Open Content Board → See ONE empty Work node
2. Click it → Side panel wizard opens (canvas stays visible)
3. Define Work through 4-step wizard
4. Activities appear as child nodes automatically
5. Create another Work → Drag arrow to connect
6. Choose connection type in popup
7. Everything auto-syncs to "All Tasks" list
Key Technical Specs:
🎨 React Flow Integration:
bashnpm install reactflow
npm install dagre  # for auto-layout
📦 Five Separate Canvas Boards:

Content Board (Books, Substack, Newsletter, Stone)
Practices Board (Walk, Stone, Two-Loop Method)
Community Board (BOPA, Events, Facilitators)
Marketing Board (Website, Outreach, First 30)
Admin Board (Accounting, Planning, Operations)

🎯 Complete Custom Nodes:

WorkNode - Glass morphism styling, shows progress
ActivityNode - Child nodes with status indicators
Both fully styled with your dark theme

🧙 4-Step Work Wizard:

Define - Name, element, work type, dates
Activities - Add activities that become child nodes
Resources - Time, tools, materials, people
Review - Confirm and save

🔗 Connection System:

Drag from Work to Work
Popup asks relationship type:

Feeds Into →
Comes From ←
Related To ↔
Blocks ⊗


Add custom labels
Styled arrows with colors

💾 Full Backend Sync:

Works save to Blue.cc as container tasks
Activities save as child tasks
Connections save as relationships
Auto-save every 2 seconds
Loads saved Works when switching dimensions

📋 Task List Integration:

Works show as 📦 Work Name
Activities show as   ↳ Activity Name
Toggle "Show Work structure" on/off
Edit in either view, syncs both ways
Link between Board ↔ List views

What Makes This Revolutionary:
✅ Work-first creation - Not task-first
✅ Organic positioning - You arrange visually
✅ Canvas is the source of truth - Not a visualization
✅ Activities are children - Visual hierarchy
✅ Bi-directional sync - Board ↔ List always in sync
✅ Five independent boards - One per dimension
The Implementation Path:
17-day build broken into clear phases:

React Flow setup (2 days)
Custom nodes (2 days)
Work wizard (3 days)
Activity nodes (2 days)
Connections (2 days)
Auto-layout (1 day)
Backend sync (2 days)
Task list integration (1 day)
Polish & testing (2 days)

This is the organic, visual project builder you envisioned. You build Works on the canvas, they become your project structure automatically. 🎨
Ready for Claude CLI or Gemini CLI to implement! 🚀
