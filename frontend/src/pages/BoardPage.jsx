import React, { useState, useCallback, useEffect } from 'react';
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
import { Plus, LayoutGrid, Lock, Unlock, Book, User, Users, Megaphone, Settings } from 'lucide-react';
import dagre from 'dagre';

import WorkNode from '../components/WorkflowBoard/WorkNode';
import ActivityNode from '../components/WorkflowBoard/ActivityNode';
import WorkWizardPanel from '../components/WorkflowBoard/WorkWizardPanel';
import ConnectionModal from '../components/WorkflowBoard/ConnectionModal';
import DimensionTabs from '../components/WorkflowBoard/DimensionTabs';
import { useTasks } from '../context/TasksContext'; // Use Context
import { useCreateTask } from '../context/CreateTaskContext'; // UI context
import { useBreadcrumbs } from '../context/BreadcrumbContext';

const nodeTypes = {
  work: WorkNode,
  activity: ActivityNode,
};

const DIMENSION_CONFIG = {
  content: { label: 'Content', icon: Book, color: 'blue' },
  practice: { label: 'Practices', icon: User, color: 'emerald' },
  community: { label: 'Community', icon: Users, color: 'pink' },
  marketing: { label: 'Marketing', icon: Megaphone, color: 'amber' },
  admin: { label: 'Admin', icon: Settings, color: 'purple' },
};

export default function BoardPage() {
  const { tasks, relationships, loading, createTask, updateTask, deleteTask, createRelationship, deleteRelationship } = useTasks(); // Consume unified state
  const { setBreadcrumbs } = useBreadcrumbs();
  const [activeDimension, setActiveDimension] = useState('content');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
// ...
  const toggleExpand = useCallback((nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      }
    });
  }, []);

  // Update Breadcrumbs
  useEffect(() => {
    const config = DIMENSION_CONFIG[activeDimension];
    if (config) {
      setBreadcrumbs([
        { label: 'Board', icon: LayoutGrid },
        { label: config.label, icon: config.icon, color: config.color }
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [activeDimension, setBreadcrumbs]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      const keyToDimension = {
        '1': 'content',
        '2': 'practice',
        '3': 'community',
        '4': 'marketing',
        '5': 'admin',
      };

      if (keyToDimension[e.key]) {
        setActiveDimension(keyToDimension[e.key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync Nodes and Edges with Tasks Context
  useEffect(() => {
    if (loading) return;
    
    // Filter tasks for current dimension
    const dimensionTasks = tasks.filter(t => {
        if (!activeDimension) return true;
        // Check if task tags include the dimension ID
        return t.tags && t.tags.some(tag => tag.toLowerCase() === activeDimension.toLowerCase());
    });

    const loadedNodes = [];
    const loadedEdges = [];
    const dimensionList = ['content', 'practice', 'community', 'marketing', 'admin'];

    // Map Tasks to Nodes
    dimensionTasks.forEach((task, i) => {
        // Use stored position or default layout
        const position = task.position || { x: 100 + (i % 3) * 300, y: 100 + Math.floor(i / 3) * 200 };
        const isExpanded = expandedNodes.has(task.id);

        // Find cross-dimension relationships
        const crossLinks = relationships.filter(rel => 
            (rel.fromTaskId === task.id || rel.toTaskId === task.id)
        ).map(rel => {
            const otherTaskId = rel.fromTaskId === task.id ? rel.toTaskId : rel.fromTaskId;
            const otherTask = tasks.find(t => t.id === otherTaskId);
            
            // Is it visible in current board?
            const isVisible = dimensionTasks.some(t => t.id === otherTaskId);
            if (isVisible) return null;

            const otherDim = otherTask?.tags.find(tag => dimensionList.includes(tag.toLowerCase()));
            
            return {
                id: rel.id,
                type: rel.type,
                targetId: otherTaskId,
                targetDimension: otherDim || 'unknown',
                targetTitle: otherTask?.title || 'Unknown Task',
                isOutgoing: rel.fromTaskId === task.id
            };
        }).filter(Boolean);
        
        loadedNodes.push({
            id: task.id,
            type: 'work',
            position,
            data: {
                label: task.title,
                description: task.description,
                status: task.status === 'Done' ? 'complete' : 'in-progress',
                element: task.tags.find(t => !dimensionList.includes(t.toLowerCase())),
                dimension: activeDimension,
                activities: task.activities || [],
                resources: {},
                workType: task.workType,
                targetOutcome: task.targetOutcome,
                startDate: task.startDate,
                targetCompletion: task.dueDate,
                isExpanded,
                crossLinks,
                onExpandToggle: () => toggleExpand(task.id),
                onJumpToWork: (id, dim) => jumpToWork(id, dim),
                onEdit: () => {
                  setSelectedNode({ id: task.id, data: { ...task, label: task.title } });
                  setWizardOpen(true);
                },
                onDelete: () => {
                  if (window.confirm('Are you sure you want to delete this work?')) {
                    deleteTask(task.id);
                  }
                }
            }
        });

        // Map Activities (Visual Children) - Only if expanded
        if (isExpanded && task.activities && task.activities.length > 0) {
            task.activities.forEach((act, idx) => {
                const actId = `${task.id}-act-${idx}`;
                loadedNodes.push({
                    id: actId,
                    type: 'activity',
                    position: { x: position.x + (idx * 160) - ((task.activities.length * 160)/2) + 80, y: position.y + 250 },
                    data: { ...act, label: act.title }
                });
                loadedEdges.push({
                    id: `e-${task.id}-${actId}`,
                    source: task.id,
                    target: actId,
                    type: 'smoothstep',
                    style: { stroke: '#475569' }
                });
            });
        }
    });

    // Map Relationships to Edges
    relationships.forEach(rel => {
        // Only show if both nodes are visible in current dimension
        const sourceVisible = dimensionTasks.some(t => t.id === rel.fromTaskId);
        const targetVisible = dimensionTasks.some(t => t.id === rel.toTaskId);

        if (sourceVisible && targetVisible) {
            loadedEdges.push({
                id: rel.id,
                source: rel.fromTaskId,
                target: rel.toTaskId,
                type: 'smoothstep',
                animated: rel.type === 'feeds-into',
                label: rel.label || '',
                style: {
                    stroke: getConnectionColor(rel.type),
                    strokeWidth: 2,
                },
                markerEnd: {
                    type: 'arrowclosed',
                    color: getConnectionColor(rel.type),
                },
                data: { type: rel.type, label: rel.label },
            });
        }
    });

    setNodes(loadedNodes);
    setEdges(loadedEdges);

  }, [tasks, relationships, activeDimension, loading, expandedNodes, toggleExpand, deleteTask]);

  // Handle edge deletion
  const onEdgesDelete = useCallback((edgesToDelete) => {
    edgesToDelete.forEach(edge => {
      // Only delete if it's a real relationship (not an activity connector)
      if (!edge.id.startsWith('e-')) {
        deleteRelationship(edge.id);
      }
    });
  }, [deleteRelationship]);

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

  // Add new Work node (Visual only until saved)
  const addNewWork = useCallback(() => {
    const newId = `new-work-${Date.now()}`;
    const newNode = {
      id: newId,
      type: 'work',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: 'New Work',
        status: 'empty',
        element: null,
        dimension: activeDimension,
        activities: [],
        resources: {},
        isExpanded: false,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    // We do NOT add to 'tasks' context yet. It's a "draft" node.
    setSelectedNode(newNode);
    setWizardOpen(true); // Open wizard immediately
  }, [activeDimension, setNodes]);

  // Handle Wizard Save
  const handleWizardSave = async (updatedData) => {
      // 1. Prepare Data
      const taskPayload = {
          title: updatedData.label,
          description: updatedData.description,
          tags: [activeDimension, updatedData.element].filter(Boolean),
          dueDate: updatedData.targetCompletion,
          startDate: updatedData.startDate,
          workType: updatedData.workType,
          targetOutcome: updatedData.targetOutcome,
          activities: updatedData.activities,
          resources: updatedData.resources,
          position: selectedNode.position
      };

      try {
          if (selectedNode.id.startsWith('new-work-')) {
              // Create via Context
              await createTask(taskPayload);
              // The Context update will trigger useEffect above, re-rendering nodes with real ID
          } else {
              // Update via Context
              await updateTask(selectedNode.id, taskPayload);
          }
      } catch (e) {
          console.error("Save failed", e);
      }

      setWizardOpen(false);
  };

  // Persist Dragged Position
  const onNodeDragStop = useCallback((event, node) => {
      // Only update backend for real nodes
      if (!node.id.startsWith('new-work-') && !node.id.includes('-act-')) {
          updateTask(node.id, { position: node.position });
      }
  }, [updateTask]);

  // Auto-layout
  const onLayout = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'TB', ranksep: 150, nodesep: 100 });

    nodes.forEach((node) => {
      const isExpanded = node.data?.isExpanded;
      dagreGraph.setNode(node.id, { 
        width: isExpanded ? 320 : 256, 
        height: isExpanded ? 400 : 120 
      });
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
          x: nodeWithPosition.x - (node.data?.isExpanded ? 160 : 128),
          y: nodeWithPosition.y - (node.data?.isExpanded ? 200 : 60),
        },
      };
    });

    setNodes(layoutedNodes);
    
    // Bulk persist new layout positions
    layoutedNodes.forEach(node => {
        if (!node.id.startsWith('new-work-') && !node.id.includes('-act-')) {
            updateTask(node.id, { position: node.position });
        }
    });
  }, [nodes, edges, setNodes, updateTask]);

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Top Navigation */}
      <DimensionTabs
        activeDimension={activeDimension}
        onDimensionChange={setActiveDimension}
      />

      {/* Canvas */}
      <div className="flex-1 relative border-t border-white/5">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete} // Added Edge Delete Listener
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop} // Added Drag Listener
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={isInteractive}
          nodesConnectable={isInteractive}
          elementsSelectable={isInteractive}
          className="bg-slate-950"
        >
          {/* ... Controls & Background ... */}
          <Background color="#1e293b" gap={20} />
          <Controls
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
            className="[&_button]:!bg-slate-900/90 [&_button]:!border-b [&_button]:!border-white/10 [&_button_svg]:!fill-slate-400 [&_button:hover]:!bg-slate-800 [&_button:hover_svg]:!fill-slate-300 [&_button[title='toggle_interactivity']]:!hidden"
          />
          <style>{`
            .react-flow__controls-interactive { display: none !important; }
          `}</style>
          <MiniMap
            className="bg-slate-900/60 border border-white/10 rounded-lg"
            nodeColor={(node) => {
              if (node.type === 'work') return '#3B82F6';
              return '#64748B';
            }}
          />

          <Panel position="top-right" className="flex gap-2">
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

            <button
              onClick={() => setIsInteractive(!isInteractive)}
              className="px-4 py-2 bg-slate-800/60 border border-white/10 text-slate-300 font-medium rounded-lg hover:border-blue-500/50 transition-all flex items-center gap-2 relative group"
              title={isInteractive ? "Lock" : "Unlock"}
            >
              {isInteractive ? <Unlock size={18} /> : <Lock size={18} />}
              <span className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {isInteractive ? "Lock" : "Unlock"}
              </span>
            </button>
          </Panel>
        </ReactFlow>

        {/* Empty State / Onboarding */}
        {nodes.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="max-w-md p-8 glass-panel border-white/10 rounded-2xl text-center animate-in fade-in zoom-in duration-500 pointer-events-auto">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                <Book className="text-blue-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Welcome to your {DIMENSION_CONFIG[activeDimension]?.label} Board</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                This is a <strong>Process-Oriented</strong> canvas. Instead of listing tasks, start by creating a <strong>Work-Product</strong>—a meaningful outcome you want to produce.
              </p>
              <div className="space-y-4">
                <button
                  onClick={addNewWork}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Create Your First Work
                </button>
                <div className="text-xs text-slate-500 flex items-center justify-center gap-4">
                  <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10">1-5</kbd> Switch Boards</span>
                  <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10">Drag</kbd> Connect Work</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Side Panel - Work Wizard */}
        {wizardOpen && selectedNode && (
          <WorkWizardPanel
            node={selectedNode}
            onClose={() => setWizardOpen(false)}
            onSave={handleWizardSave}
          />
        )}

        {/* Connection Modal */}
        {connectionModal && (
          <ConnectionModal
            connection={connectionModal}
            onConfirm={(connectionType, label) => {
              createRelationship(connectionModal.source, connectionModal.target, connectionType);
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
