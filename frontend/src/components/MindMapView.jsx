import React, { useCallback, useEffect } from 'react';
import ReactFlow, { 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Controls, 
  Background, 
  MiniMap, 
  MarkerType 
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { useCreateTask } from '../context/CreateTaskContext';

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // Offset slightly for visual variance if needed
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes: layoutedNodes, edges };
};

const DIMENSIONS = [
  { id: 'content', label: 'Content', color: '#3B82F6', children: ['substack', 'newsletter', 'books'] },
  { id: 'practice', label: 'Practices', color: '#10B981', children: ['stone', 'walk', 'b2b'] },
  { id: 'community', label: 'Community', color: '#EC4899', children: ['mission', 'development', 'first30'] },
  { id: 'marketing', label: 'Marketing', color: '#F59E0B', children: ['bopa', 'website', 'marketing-other'] },
  { id: 'admin', label: 'Admin', color: '#8B5CF6', children: ['planning', 'accounting', 'admin-other'] }
];

export default function MindMapView({ tasks }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { openCreateTask } = useCreateTask();

  useEffect(() => {
    const { nodes: initialNodes, edges: initialEdges } = createGraph(tasks);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [tasks, setNodes, setEdges]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onNodeClick = (event, node) => {
      // If it's a Work node (not a dimension/element), open detail/edit
      if (node.data.type === 'work') {
          openCreateTask({ taskId: node.id }); // Ideally pass full task or ID to edit
      }
  };

  return (
    <div className="h-full w-full bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
      >
        <Controls style={{ backgroundColor: '#1e293b', borderColor: '#334155', fill: 'white' }} />
        <Background color="#334155" gap={16} />
        <MiniMap style={{ backgroundColor: '#1e293b' }} nodeColor={(n) => {
            if(n.data.type === 'dimension') return n.data.color;
            if(n.data.type === 'element') return '#475569';
            return '#3b82f6';
        }} />
      </ReactFlow>
    </div>
  );
}

function createGraph(tasks) {
    const nodes = [];
    const edges = [];
    const elementsMap = {}; // id -> label

    // 1. Create Dimension Nodes (Center/Root)
    // Actually dagre works best with hierarchy. 
    // We can make Dimensions root nodes.
    
    DIMENSIONS.forEach(dim => {
        nodes.push({
            id: dim.id,
            data: { label: dim.label, type: 'dimension', color: dim.color },
            position: { x: 0, y: 0 },
            style: { 
                background: dim.color, 
                color: 'white', 
                border: 'none', 
                borderRadius: '50px', 
                width: 150,
                textAlign: 'center',
                fontWeight: 'bold'
            }
        });

        // 2. Create Element Nodes
        dim.children.forEach(childId => {
            const childLabel = childId.charAt(0).toUpperCase() + childId.slice(1).replace('-', ' ');
            elementsMap[childId] = childLabel;
            
            nodes.push({
                id: childId,
                data: { label: childLabel, type: 'element' },
                position: { x: 0, y: 0 },
                style: {
                    background: '#1e293b',
                    color: '#cbd5e1',
                    border: `1px solid ${dim.color}`,
                    borderRadius: '8px',
                    width: 120,
                    fontSize: '12px',
                    textAlign: 'center'
                }
            });

            // Edge Dim -> Element
            edges.push({
                id: `e-${dim.id}-${childId}`,
                source: dim.id,
                target: childId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: dim.color, opacity: 0.5 }
            });
        });
    });

    // 3. Create Work Nodes (Tasks)
    tasks.forEach(task => {
        // Find parent element
        // Assumption: task has tag matching an element
        // If multiple, pick first valid element
        const elementTag = task.tags.find(tag => elementsMap[tag.toLowerCase()] || elementsMap[tag]);
        
        if (elementTag) {
            const parentId = elementTag.toLowerCase();
            
            nodes.push({
                id: task.id,
                data: { label: task.title, type: 'work' },
                position: { x: 0, y: 0 },
                style: {
                    background: '#0f172a',
                    color: 'white',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    width: 180,
                    fontSize: '12px',
                    padding: '8px'
                }
            });

            edges.push({
                id: `e-${parentId}-${task.id}`,
                source: parentId,
                target: task.id,
                type: 'default',
                style: { stroke: '#475569' }
            });
        }
    });

    return { nodes, edges };
}
