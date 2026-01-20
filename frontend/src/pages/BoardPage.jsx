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
import { Plus, LayoutGrid, Lock, Unlock } from 'lucide-react';
import dagre from 'dagre';

import WorkNode from '../components/WorkflowBoard/WorkNode';
import ActivityNode from '../components/WorkflowBoard/ActivityNode';
import WorkWizardPanel from '../components/WorkflowBoard/WorkWizardPanel';
import ConnectionModal from '../components/WorkflowBoard/ConnectionModal';
import DimensionTabs from '../components/WorkflowBoard/DimensionTabs';
import { useTasks } from '../context/TasksContext'; // Use Context
import { useCreateTask } from '../context/CreateTaskContext'; // UI context

const nodeTypes = {
  work: WorkNode,
  activity: ActivityNode,
};

export default function BoardPage() {
  const { tasks, loading, createTask, updateTask } = useTasks(); // Consume unified state
  const [activeDimension, setActiveDimension] = useState('content');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [connectionModal, setConnectionModal] = useState(null);
  const [isInteractive, setIsInteractive] = useState(true);

  // Sync Nodes with Tasks Context
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

    // Map Tasks to Nodes
    dimensionTasks.forEach((task, i) => {
        // Use stored position or default layout
        const position = task.position || { x: 100 + (i % 3) * 300, y: 100 + Math.floor(i / 3) * 200 };
        
        loadedNodes.push({
            id: task.id,
            type: 'work',
            position,
            data: {
                label: task.title,
                description: task.description,
                status: task.status === 'Done' ? 'complete' : 'in-progress',
                element: task.tags.find(t => t !== activeDimension),
                dimension: activeDimension,
                activities: task.activities || [],
                resources: task.resources || {},
                workType: task.workType,
                targetOutcome: task.targetOutcome,
                startDate: task.startDate,
                targetCompletion: task.dueDate,
            }
        });

        // Map Activities (Visual Children)
        if (task.activities && task.activities.length > 0) {
            task.activities.forEach((act, idx) => {
                const actId = `${task.id}-act-${idx}`;
                loadedNodes.push({
                    id: actId,
                    type: 'activity',
                    position: { x: position.x + (idx * 160) - ((task.activities.length * 160)/2) + 80, y: position.y + 200 },
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

    // If no tasks, show a starter node (optional, but maybe better to show empty state?)
    // Keeping existing logic for now but marking it as 'unsaved'
    if (loadedNodes.length === 0 && !loading) {
         // Optionally add a placeholder or just let it be empty
    }

    // Only update if significantly different to avoid jitter during drag? 
    // Actually, ReactFlow handles internal state. We should only overwrite if 'tasks' changed from OUTSIDE.
    // This is the hard part of syncing local vs global state. 
    // For V1: We overwrite. This might reset drag if another user updated, but we are single user.
    setNodes(loadedNodes);
    setEdges(loadedEdges);

  }, [tasks, activeDimension, loading]); // Re-run when global tasks change or dimension changes

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
      dagreGraph.setNode(node.id, { width: 256, height: 100 });
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
          x: nodeWithPosition.x - 128,
          y: nodeWithPosition.y - 50,
        },
      };
    });

    setNodes(layoutedNodes);
    
    // Persist new layout positions? 
    // Ideally yes, but bulk update might be heavy. Let's skip bulk persist for V1.
  }, [nodes, edges, setNodes]);

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
              // Ideally save relationship to backend here
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
