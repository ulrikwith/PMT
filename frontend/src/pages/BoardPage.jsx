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
import { Plus, LayoutGrid } from 'lucide-react';
import dagre from 'dagre';

import WorkNode from '../components/WorkflowBoard/WorkNode';
import ActivityNode from '../components/WorkflowBoard/ActivityNode';
import WorkWizardPanel from '../components/WorkflowBoard/WorkWizardPanel';
import ConnectionModal from '../components/WorkflowBoard/ConnectionModal';
import DimensionTabs from '../components/WorkflowBoard/DimensionTabs';
import api from '../services/api';
import { useCreateTask } from '../context/CreateTaskContext';
import MindMapView from '../components/MindMapView';

const nodeTypes = {
  work: WorkNode,
  activity: ActivityNode,
};

export default function BoardPage() {
  const [activeDimension, setActiveDimension] = useState('content');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [connectionModal, setConnectionModal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Works from Backend
  useEffect(() => {
    loadDimensionData(activeDimension);
  }, [activeDimension]);

  const loadDimensionData = async (dimension) => {
      setLoading(true);
      try {
          const tasks = await api.getTasks({ dimension }); 
          // Note: In real app, we need to filter further or trust backend. 
          // Current backend simple filter might return cross-dimension if tags overlap.
          // We'll trust the list for now and map them to nodes.
          
          const loadedNodes = [];
          const loadedEdges = [];

          // 1. Map Works
          // Assuming 'workType' exists on tasks or we treat all top-level tasks in this dim as Works
          const workTasks = tasks.filter(t => t.workType); // Filter by metadata if available, else all?
          // Fallback: treat all tasks as works for V1 migration if workType missing, 
          // but better to only show ones created via this new tool or explicitly tagged.
          // Let's assume we map ALL tasks for now to visualize existing data.
          
          workTasks.forEach((task, i) => {
              // Position: stored in metadata or auto-layout fallback
              const position = task.position || { x: 100 + (i % 3) * 300, y: 100 + Math.floor(i / 3) * 200 };
              
              loadedNodes.push({
                  id: task.id,
                  type: 'work',
                  position,
                  data: {
                      label: task.title,
                      status: task.status === 'Done' ? 'complete' : 'in-progress',
                      element: task.tags.find(t => t !== dimension), // Simple guess
                      dimension: dimension,
                      activities: task.activities || [],
                      resources: task.resources || {},
                      // ... copy other meta
                  }
              });

              // 2. Map Activities (Children)
              if (task.activities && task.activities.length > 0) {
                  task.activities.forEach((act, idx) => {
                      const actId = `${task.id}-act-${idx}`;
                      loadedNodes.push({
                          id: actId,
                          type: 'activity',
                          position: { x: position.x + (idx * 50), y: position.y + 150 + (idx * 50) }, // Temp overlap position
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

          if (loadedNodes.length === 0) {
              // Initialize with one empty node if nothing exists
              const initialNode = {
                id: `new-work-${Date.now()}`,
                type: 'work',
                position: { x: 400, y: 300 },
                data: {
                  label: 'New Work',
                  status: 'empty',
                  element: null,
                  dimension: dimension,
                  activities: [],
                  resources: {},
                },
              };
              loadedNodes.push(initialNode);
          }

          setNodes(loadedNodes);
          setEdges(loadedEdges);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

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
  }, [activeDimension, setNodes]);

  // Handle Wizard Save
  const handleWizardSave = async (updatedData) => {
      // 1. Update the Work Node
      const updatedNode = {
          ...selectedNode,
          data: { ...selectedNode.data, ...updatedData }
      };
      
      setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? updatedNode : n));

      // 2. Persist to Backend (Create or Update)
      // If it's a new node (local ID), create. If existing (from backend), update.
      try {
          let savedTask;
          if (selectedNode.id.startsWith('work-') || selectedNode.id.startsWith('new-work-')) {
              // Create
              const res = await api.createTask({
                  title: updatedData.label,
                  description: updatedData.description,
                  tags: [activeDimension, updatedData.element].filter(Boolean),
                  dueDate: updatedData.targetCompletion,
                  // Pass meta
                  workType: updatedData.workType,
                  targetOutcome: updatedData.targetOutcome,
                  startDate: updatedData.startDate,
                  activities: updatedData.activities,
                  resources: updatedData.resources,
                  position: selectedNode.position
              });
              savedTask = res.data || res; // api wrapper might return data directly
              
              // Replace local ID with server ID in nodes
              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, id: savedTask.id } : n));
          } else {
              // Update
              await api.updateTask(selectedNode.id, {
                  title: updatedData.label,
                  description: updatedData.description,
                  dueDate: updatedData.targetCompletion,
                  workType: updatedData.workType,
                  targetOutcome: updatedData.targetOutcome,
                  startDate: updatedData.startDate,
                  activities: updatedData.activities,
                  resources: updatedData.resources,
                  // position updates usually happen on drag stop, handled separately
              });
              savedTask = { ...updatedNode, id: selectedNode.id };
          }

          // 3. Handle Child Activity Nodes
          // Remove old activity nodes for this work
          const nonActivityNodes = nodes.filter(n => !n.id.startsWith(`${selectedNode.id}-act-`)); // Tricky with ID change
          // For simplicity in V1: Just regenerate visual activity nodes from data
          const newActivityNodes = (updatedData.activities || []).map((act, idx) => ({
              id: `${savedTask.id || selectedNode.id}-act-${idx}`,
              type: 'activity',
              position: { 
                  x: selectedNode.position.x + (idx * 160) - ((updatedData.activities.length * 160)/2) + 80, 
                  y: selectedNode.position.y + 200 
              },
              data: { ...act, label: act.title }
          }));
          
          const newActivityEdges = newActivityNodes.map(an => ({
              id: `e-${savedTask.id || selectedNode.id}-${an.id}`,
              source: savedTask.id || selectedNode.id,
              target: an.id,
              type: 'smoothstep',
              style: { stroke: '#475569' }
          }));

          // Re-merge nodes
          // We need to be careful not to duplicate or lose other nodes
          // Ideally we filter out old children of THIS node and add new ones
          // But IDs might have changed.
          // Let's just refresh the view or append safely.
          // For now, appending new ones.
          setNodes(nds => [...nds, ...newActivityNodes]);
          setEdges(eds => [...eds, ...newActivityEdges]);

      } catch (e) {
          console.error("Save failed", e);
      }

      setWizardOpen(false);
  };

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
      // We only want to move them if they aren't manually positioned? 
      // Dagre overrides. That's fine for "Auto Layout" button.
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 128,
          y: nodeWithPosition.y - 50,
        },
      };
    });

    setNodes(layoutedNodes);
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
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-950"
        >
          <Background color="#1e293b" gap={20} />
          <Controls className="bg-slate-800/60 border border-white/10 rounded-lg fill-white" />
          <MiniMap
            className="bg-slate-900/60 border border-white/10 rounded-lg"
            nodeColor={(node) => {
              if (node.type === 'work') return '#3B82F6';
              return '#64748B';
            }}
          />

          {/* Floating Action Panel */}
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
