import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Book } from 'lucide-react';

import WorkNode from '../components/WorkflowBoard/WorkNode';
import ActivityNode from '../components/WorkflowBoard/ActivityNode';
import WorkWizardPanel from '../components/WorkflowBoard/WorkWizardPanel';
import ConnectionModal from '../components/WorkflowBoard/ConnectionModal';
import DimensionTabs from '../components/WorkflowBoard/DimensionTabs';
import { useTasks } from '../context/TasksContext';
import { useBreadcrumbs } from '../context/BreadcrumbContext';
import { DIMENSIONS, getDimensionConfig } from '../constants/taxonomy';
import { LayoutGrid } from 'lucide-react';

const nodeTypes = {
  work: WorkNode,
  activity: ActivityNode,
};

// Grid configuration - spreadsheet-like cells
const GRID = {
  CELL_WIDTH: 280,       // Width of collapsed cell
  CELL_HEIGHT: 160,      // Height of collapsed cell
  EXPANDED_WIDTH: 660,   // Width when expanded (with activities)
  EXPANDED_HEIGHT: 450,  // Height when expanded
  GAP_X: 40,             // Horizontal gap between cells
  GAP_Y: 40,             // Vertical gap between cells
  COLS: 4,               // Number of columns
  ORIGIN_X: 50,
  ORIGIN_Y: 50,
};

// Calculate position for a cell, accounting for expanded cells before it
function calculateCellPosition(cellIndex, expandedSet, allTasks) {
  const row = Math.floor(cellIndex / GRID.COLS);
  const col = cellIndex % GRID.COLS;

  let x = GRID.ORIGIN_X;
  let y = GRID.ORIGIN_Y;

  // Calculate X: sum of widths of all cells to the left in the same row
  for (let c = 0; c < col; c++) {
    const idx = row * GRID.COLS + c;
    const task = allTasks[idx];
    const isExpanded = task && expandedSet.has(task.id);
    const cellWidth = isExpanded ? GRID.EXPANDED_WIDTH : GRID.CELL_WIDTH;
    x += cellWidth + GRID.GAP_X;
  }

  // Calculate Y: sum of heights of all rows above
  for (let r = 0; r < row; r++) {
    // Find max height in that row
    let maxHeight = GRID.CELL_HEIGHT;
    for (let c = 0; c < GRID.COLS; c++) {
      const idx = r * GRID.COLS + c;
      const task = allTasks[idx];
      if (task && expandedSet.has(task.id)) {
        maxHeight = Math.max(maxHeight, GRID.EXPANDED_HEIGHT);
      }
    }
    y += maxHeight + GRID.GAP_Y;
  }

  return { x, y };
}

// Calculate total grid bounds for centering
function calculateGridBounds(tasks, expandedSet) {
  if (tasks.length === 0) return { width: 0, height: 0, centerX: 0, centerY: 0 };

  const rows = Math.ceil(tasks.length / GRID.COLS);
  let totalWidth = 0;
  let totalHeight = 0;

  // Calculate total width (max row width)
  for (let r = 0; r < rows; r++) {
    let rowWidth = 0;
    for (let c = 0; c < GRID.COLS; c++) {
      const idx = r * GRID.COLS + c;
      if (idx >= tasks.length) break;
      const task = tasks[idx];
      const isExpanded = expandedSet.has(task.id);
      rowWidth += (isExpanded ? GRID.EXPANDED_WIDTH : GRID.CELL_WIDTH) + GRID.GAP_X;
    }
    totalWidth = Math.max(totalWidth, rowWidth - GRID.GAP_X);
  }

  // Calculate total height
  for (let r = 0; r < rows; r++) {
    let maxHeight = GRID.CELL_HEIGHT;
    for (let c = 0; c < GRID.COLS; c++) {
      const idx = r * GRID.COLS + c;
      if (idx >= tasks.length) break;
      const task = tasks[idx];
      if (expandedSet.has(task.id)) {
        maxHeight = Math.max(maxHeight, GRID.EXPANDED_HEIGHT);
      }
    }
    totalHeight += maxHeight + GRID.GAP_Y;
  }
  totalHeight -= GRID.GAP_Y;

  return {
    width: totalWidth,
    height: totalHeight,
    centerX: GRID.ORIGIN_X + totalWidth / 2,
    centerY: GRID.ORIGIN_Y + totalHeight / 2
  };
}

function BoardPageInner() {
  const { tasks, relationships, loading, createTask, updateTask, deleteTask, createRelationship, deleteRelationship } = useTasks();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { setCenter, fitView } = useReactFlow();
  const [activeDimension, setActiveDimension] = useState('content');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [connectionModal, setConnectionModal] = useState(null);
  const initialCenterDone = useRef(false);

  const toggleExpand = useCallback((nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const jumpToWork = useCallback((id, dim) => {
    setActiveDimension(dim.toLowerCase());
  }, []);

  // Update Breadcrumbs
  useEffect(() => {
    const config = getDimensionConfig(activeDimension);
    if (config) {
      setBreadcrumbs([
        { label: 'Board', icon: LayoutGrid },
        { label: config.label, icon: config.icon, color: config.color }
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [activeDimension, setBreadcrumbs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      const keyToDimension = { '1': 'content', '2': 'practice', '3': 'community', '4': 'marketing', '5': 'admin' };
      if (keyToDimension[e.key]) {
        setActiveDimension(keyToDimension[e.key]);
        initialCenterDone.current = false; // Re-center when switching dimensions
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync Nodes with Tasks - Fixed cell positions
  useEffect(() => {
    if (loading) return;

    // Filter tasks for current dimension and sort by creation date (oldest first)
    const dimensionTasks = tasks
      .filter(t => {
        if (!activeDimension) return true;
        return t.tags && t.tags.some(tag => tag.toLowerCase() === activeDimension.toLowerCase());
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const loadedNodes = [];
    const loadedEdges = [];
    const dimensionIds = DIMENSIONS.map(d => d.id);

    // Map Tasks to Nodes with FIXED cell positions (based on index)
    dimensionTasks.forEach((task, cellIndex) => {
      // Calculate position based on cell index and expanded states
      const position = calculateCellPosition(cellIndex, expandedNodes, dimensionTasks);
      const isExpanded = expandedNodes.has(task.id);

      // Find cross-dimension relationships
      const crossLinks = relationships.filter(rel =>
        (rel.fromTaskId === task.id || rel.toTaskId === task.id)
      ).map(rel => {
        const otherTaskId = rel.fromTaskId === task.id ? rel.toTaskId : rel.fromTaskId;
        const otherTask = tasks.find(t => t.id === otherTaskId);
        const isVisible = dimensionTasks.some(t => t.id === otherTaskId);
        if (isVisible) return null;
        const otherDim = otherTask?.tags.find(tag => dimensionIds.includes(tag.toLowerCase()));
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
        draggable: false, // LOCKED - cannot drag
        data: {
          label: task.title,
          description: task.description,
          status: task.status === 'Done' ? 'complete' : 'in-progress',
          element: task.tags.find(t => !dimensionIds.includes(t.toLowerCase())),
          dimension: activeDimension,
          activities: task.activities || [],
          resources: task.resources || {},
          workType: task.workType,
          targetOutcome: task.targetOutcome,
          startDate: task.startDate,
          targetCompletion: task.dueDate,
          isExpanded,
          crossLinks,
          cellIndex, // Store cell index for reference
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
    });

    // Map Relationships to Edges
    relationships.forEach(rel => {
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
          style: { stroke: getConnectionColor(rel.type), strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: getConnectionColor(rel.type) },
          data: { type: rel.type, label: rel.label },
        });
      }
    });

    setNodes(loadedNodes);
    setEdges(loadedEdges);

    // Center view on first load or dimension change
    if (!initialCenterDone.current && dimensionTasks.length > 0) {
      const bounds = calculateGridBounds(dimensionTasks, expandedNodes);
      setTimeout(() => {
        setCenter(bounds.centerX, bounds.centerY, { zoom: 1, duration: 300 });
        initialCenterDone.current = true;
      }, 100);
    }

  }, [tasks, relationships, activeDimension, loading, expandedNodes, toggleExpand, deleteTask, jumpToWork, setNodes, setEdges, setCenter]);

  // Reset center flag when dimension changes
  useEffect(() => {
    initialCenterDone.current = false;
  }, [activeDimension]);

  const onEdgesDelete = useCallback((edgesToDelete) => {
    edgesToDelete.forEach(edge => {
      if (!edge.id.startsWith('e-')) {
        deleteRelationship(edge.id);
      }
    });
  }, [deleteRelationship]);

  const onNodeClick = useCallback((event, node) => {
    if (node.type === 'work') {
      setSelectedNode(node);
      setWizardOpen(true);
    }
  }, []);

  const onConnect = useCallback((params) => {
    setConnectionModal(params);
  }, []);

  // Add new Work - automatically goes to next cell
  const addNewWork = useCallback(() => {
    const dimensionTasks = tasks
      .filter(t => t.tags && t.tags.some(tag => tag.toLowerCase() === activeDimension.toLowerCase()))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const newId = `new-work-${Date.now()}`;
    const cellIndex = dimensionTasks.length; // Next available cell
    const position = calculateCellPosition(cellIndex, expandedNodes, [...dimensionTasks, { id: newId }]);

    const newNode = {
      id: newId,
      type: 'work',
      position,
      draggable: false,
      data: {
        label: 'New Work',
        status: 'empty',
        element: null,
        dimension: activeDimension,
        activities: [],
        resources: {},
        isExpanded: false,
        cellIndex,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
    setWizardOpen(true);
  }, [activeDimension, setNodes, tasks, expandedNodes]);

  const handleWizardSave = async (updatedData) => {
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
    };

    try {
      if (selectedNode.id.startsWith('new-work-')) {
        await createTask(taskPayload);
      } else {
        await updateTask(selectedNode.id, taskPayload);
      }
    } catch (e) {
      console.error("Save failed", e);
    }

    setWizardOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <DimensionTabs
        activeDimension={activeDimension}
        onDimensionChange={(dim) => {
          setActiveDimension(dim);
          initialCenterDone.current = false;
        }}
      />

      <div className="flex-1 relative border-t border-white/5">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgesDelete={onEdgesDelete}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          nodesDraggable={false} // All nodes locked
          nodesConnectable={true}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={true}
          className="bg-slate-950"
        >
          <Background color="#1e293b" gap={20} />
          <Controls
            className="!bg-slate-800/40 !backdrop-blur-xl !border !border-white/5 !shadow-xl !rounded-xl !m-4 [&_button]:!bg-transparent [&_button]:!border-none [&_button]:!text-slate-400 [&_button:hover]:!bg-white/10 [&_button:hover]:!text-white [&_button_svg]:!fill-current"
          />
          <MiniMap
            style={{ height: 120, width: 160 }}
            zoomable
            pannable
            maskColor="rgba(2, 6, 23, 0.7)"
            className="!bg-slate-800/40 !backdrop-blur-xl !border !border-white/5 !shadow-xl !rounded-xl !m-4"
            nodeColor={(node) => node.type === 'work' ? '#3B82F6' : '#64748B'}
          />

          <Panel position="top-right" className="flex gap-2">
            <button
              onClick={addNewWork}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Add Work
            </button>
          </Panel>
        </ReactFlow>

        {/* Empty State */}
        {nodes.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="max-w-md p-8 glass-panel border-white/10 rounded-2xl text-center animate-in fade-in zoom-in duration-500 pointer-events-auto">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                <Book className="text-blue-500" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Welcome to your {getDimensionConfig(activeDimension)?.label} Board</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Create <strong>Work-Products</strong>—meaningful outcomes you want to produce. Each Work occupies a fixed cell in the grid.
              </p>
              <button
                onClick={addNewWork}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Create Your First Work
              </button>
              <div className="mt-4 text-xs text-slate-500">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-white/10">1-5</kbd> Switch Boards
              </div>
            </div>
          </div>
        )}

        {wizardOpen && selectedNode && (
          <WorkWizardPanel
            node={selectedNode}
            onClose={() => setWizardOpen(false)}
            onSave={handleWizardSave}
          />
        )}

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

// Wrap with ReactFlowProvider to access useReactFlow hook
export default function BoardPage() {
  return (
    <ReactFlowProvider>
      <BoardPageInner />
    </ReactFlowProvider>
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
