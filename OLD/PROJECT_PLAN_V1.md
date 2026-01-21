# Inner Allies Project Management Tool v1.0
## Detailed Implementation Plan

---

## Executive Summary

This document provides a complete technical specification for building a custom project management tool designed specifically for W.'s multi-dimensional awakening work. The tool integrates with Blue.cc's API as the cloud backend while maintaining local resilience, and serves the unique needs of managing content creation, practice development, and infrastructure building as interconnected layers rather than linear tasks.

**Technology Stack:**
- Frontend: React 18 + Vite
- Backend: Node.js + Express + GraphQL
- Cloud Storage: Blue.cc API
- Local Fallback: JSON file storage
- Current Status: Backend API connection established ✅

---

## Table of Contents

1. [Phase 1: Foundation & Core Features](#phase-1-foundation--core-features)
2. [Phase 2: Multi-Dimensional Task System](#phase-2-multi-dimensional-task-system)
3. [Phase 3: Content-Practice Integration](#phase-3-content-practice-integration)
4. [Phase 4: Launch Orchestration](#phase-4-launch-orchestration)
5. [Phase 5: Polish & Optimization](#phase-5-polish--optimization)
6. [Technical Specifications](#technical-specifications)
7. [API Integration Details](#api-integration-details)
8. [Database Schema](#database-schema)
9. [Component Architecture](#component-architecture)
10. [Testing Strategy](#testing-strategy)

---

## Phase 1: Foundation & Core Features

**Goal:** Get basic task management working with Blue.cc sync

### 1.1 Backend API Enhancement

**File:** `/backend/blueClient.js`

#### Task 1.1.1: Implement Company & Project Auto-Setup
```javascript
// Add method to ensure user has company and project
async ensureWorkspace() {
  try {
    // Get or create company
    const companyId = await this.getCompanyId();
    
    // Get or create default project
    const projectId = await this.getDefaultProjectId(companyId);
    
    // Get or create default todo list
    const todoListId = await this.getDefaultTodoListId(projectId);
    
    return { companyId, projectId, todoListId };
  } catch (error) {
    console.error('Workspace setup failed:', error);
    this.useLocalMode = true;
    return null;
  }
}
```

**Acceptance Criteria:**
- [ ] Automatically creates company if none exists
- [ ] Creates "Inner Allies" project on first run
- [ ] Creates default "Tasks" todo list
- [ ] Gracefully falls back to local mode on failure
- [ ] Logs setup progress clearly

#### Task 1.1.2: Enhance Task CRUD Operations
```javascript
// Update getTasks to handle Blue.cc todo structure
async getTasks(filters = {}) {
  if (this.useLocalMode) {
    return { success: true, data: this.localTasks };
  }

  try {
    const todoListId = await this.getDefaultTodoListId();
    
    const query = `
      query GetTodos($todoListId: ID!) {
        todoList(id: $todoListId) {
          todos {
            id
            title
            text
            done
            position
            tags {
              id
              name
            }
            createdAt
            updatedAt
          }
        }
      }
    `;
    
    const result = await this.query(query, { todoListId });
    
    if (result.success) {
      const tasks = result.data.todoList.todos.map(todo => ({
        id: todo.id,
        title: todo.title,
        description: todo.text || '',
        status: todo.done ? 'Done' : 'In Progress',
        tags: todo.tags.map(t => t.name),
        position: todo.position,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt
      }));
      
      // Sync to local storage as cache
      this.localTasks = tasks;
      await this.saveLocalStore();
      
      return { success: true, data: tasks };
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    this.useLocalMode = true;
    return { success: true, data: this.localTasks };
  }
}
```

**Acceptance Criteria:**
- [ ] Fetches tasks from Blue.cc with all metadata
- [ ] Maps Blue.cc todos to our task structure
- [ ] Handles tags/labels from Blue.cc
- [ ] Caches to local storage for resilience
- [ ] Falls back gracefully on errors

#### Task 1.1.3: Implement Tag Management
```javascript
async getTags() {
  // Fetch all unique tags from tasks
}

async createTag(name, color) {
  // Create tag in Blue.cc
}

async addTagToTask(taskId, tagName) {
  // Associate tag with task
}

async removeTagFromTask(taskId, tagName) {
  // Remove tag association
}
```

**Acceptance Criteria:**
- [ ] Can create custom tags
- [ ] Tags have colors for visual distinction
- [ ] Tags sync to Blue.cc
- [ ] Local mode maintains tags in JSON

---

### 1.2 Frontend Core UI

**Directory:** `/frontend/src/`

#### Task 1.2.1: Create Base Layout Component
**File:** `components/Layout.jsx`

```jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Header shows connection status (cloud/local)
- [ ] Sidebar for navigation
- [ ] Clean, distraction-free design

#### Task 1.2.2: Build Task List Component
**File:** `components/TaskList.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TaskCard from './TaskCard';
import CreateTaskForm from './CreateTaskForm';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const response = await axios.get('http://localhost:3001/api/tasks');
      setTasks(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask(taskData) {
    try {
      const response = await axios.post('http://localhost:3001/api/tasks', taskData);
      setTasks([...tasks, response.data]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateTask(taskId, updates) {
    try {
      const response = await axios.put(`http://localhost:3001/api/tasks/${taskId}`, updates);
      setTasks(tasks.map(t => t.id === taskId ? response.data : t));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteTask(taskId) {
    try {
      await axios.delete(`http://localhost:3001/api/tasks/${taskId}`);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <CreateTaskForm onSubmit={handleCreateTask} />
      <div className="grid gap-4 mt-6">
        {tasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />
        ))}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Displays all tasks
- [ ] Shows loading state
- [ ] Handles errors gracefully
- [ ] Real-time updates after CRUD operations

#### Task 1.2.3: Build Task Card Component
**File:** `components/TaskCard.jsx`

```jsx
import React, { useState } from 'react';

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);

  async function handleSave() {
    await onUpdate(task.id, { title, description });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <input
          className="w-full mb-2 p-2 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
        <textarea
          className="w-full mb-2 p-2 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
        />
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded">
            Save
          </button>
          <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{task.title}</h3>
          {task.description && (
            <p className="text-gray-600 mt-1">{task.description}</p>
          )}
          <div className="flex gap-2 mt-2">
            {task.tags?.map(tag => (
              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button 
            onClick={() => onDelete(task.id)}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Inline editing mode
- [ ] Shows tags visually
- [ ] Edit and delete actions
- [ ] Smooth transitions

#### Task 1.2.4: Build Create Task Form
**File:** `components/CreateTaskForm.jsx`

```jsx
import React, { useState } from 'react';

export default function CreateTaskForm({ onSubmit }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    
    await onSubmit({ title, description });
    setTitle('');
    setDescription('');
    setIsOpen(false);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors"
      >
        + Add Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow">
      <input
        className="w-full mb-2 p-2 border rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        autoFocus
      />
      <textarea
        className="w-full mb-2 p-2 border rounded"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={3}
      />
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
          Create
        </button>
        <button 
          type="button"
          onClick={() => setIsOpen(false)} 
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

**Acceptance Criteria:**
- [ ] Expandable form (collapsed by default)
- [ ] Title required, description optional
- [ ] Keyboard shortcuts (Enter to submit, Esc to cancel)
- [ ] Clears form after submission

---

## Phase 2: Multi-Dimensional Task System

**Goal:** Enable tagging and filtering by work dimensions

### 2.1 Tag System Implementation

#### Task 2.1.1: Backend Tag Support
**File:** `/backend/blueClient.js`

```javascript
// Predefined dimension tags
const DIMENSION_TAGS = {
  CONTENT: { name: 'content', color: '#3B82F6' },      // Blue
  PRACTICE: { name: 'practice', color: '#10B981' },    // Green
  INFRASTRUCTURE: { name: 'infrastructure', color: '#8B5CF6' }, // Purple
  MARKETING: { name: 'marketing', color: '#F59E0B' },  // Amber
  COMMUNITY: { name: 'community', color: '#EC4899' }   // Pink
};

async ensureDimensionTags() {
  // Create dimension tags in Blue.cc if they don't exist
  for (const tag of Object.values(DIMENSION_TAGS)) {
    await this.ensureTagExists(tag.name, tag.color);
  }
}

async ensureTagExists(name, color) {
  // Check if tag exists, create if not
  // Blue.cc API call to create tag
}
```

**Acceptance Criteria:**
- [ ] Creates predefined dimension tags on first run
- [ ] Tags have consistent colors
- [ ] Can create custom tags beyond dimensions
- [ ] Tags sync to Blue.cc

#### Task 2.1.2: Frontend Tag Selector
**File:** `components/TagSelector.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TagSelector({ selectedTags, onChange }) {
  const [availableTags, setAvailableTags] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    const response = await axios.get('http://localhost:3001/api/tags');
    setAvailableTags(response.data);
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    const response = await axios.post('http://localhost:3001/api/tags', {
      name: newTagName
    });
    setAvailableTags([...availableTags, response.data]);
    setNewTagName('');
    setIsCreating(false);
  }

  function toggleTag(tagName) {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter(t => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableTags.map(tag => (
        <button
          key={tag.name}
          onClick={() => toggleTag(tag.name)}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedTags.includes(tag.name)
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          style={selectedTags.includes(tag.name) ? { backgroundColor: tag.color } : {}}
        >
          #{tag.name}
        </button>
      ))}
      {isCreating ? (
        <input
          className="px-3 py-1 border rounded-full text-sm"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
          onBlur={handleCreateTag}
          placeholder="New tag..."
          autoFocus
        />
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="px-3 py-1 border-2 border-dashed border-gray-300 rounded-full text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500"
        >
          + Tag
        </button>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows all available tags
- [ ] Selected tags highlighted
- [ ] Can create new tags inline
- [ ] Color-coded dimension tags

### 2.2 Relationship Mapping

#### Task 2.2.1: Task Relationships Backend
**File:** `/backend/blueClient.js`

```javascript
// Add relationship tracking to task structure
async createTaskRelationship(fromTaskId, toTaskId, relationshipType) {
  // Types: 'blocks', 'requires', 'generates', 'informs'
  // Store in Blue.cc custom fields or local JSON
}

async getTaskRelationships(taskId) {
  // Fetch all relationships for a task
}

async getRelatedTasks(taskId) {
  // Get all tasks related to this one
}
```

**Acceptance Criteria:**
- [ ] Can link tasks with relationship types
- [ ] Bidirectional relationships (if A blocks B, B is blocked by A)
- [ ] Relationship metadata stored
- [ ] Query relationships efficiently

#### Task 2.2.2: Relationship Visualizer
**File:** `components/RelationshipMap.jsx`

```jsx
// Visual display of how tasks relate to each other
// Simple list view initially, can enhance with graph later

export default function RelationshipMap({ taskId, relationships }) {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded">
      <h4 className="font-semibold mb-2">Related Tasks</h4>
      {relationships.blocks?.length > 0 && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">Blocks:</span>
          {relationships.blocks.map(task => (
            <TaskLink key={task.id} task={task} />
          ))}
        </div>
      )}
      {relationships.requires?.length > 0 && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">Requires:</span>
          {relationships.requires.map(task => (
            <TaskLink key={task.id} task={task} />
          ))}
        </div>
      )}
      {relationships.generates?.length > 0 && (
        <div className="mb-2">
          <span className="text-sm text-gray-600">Generates:</span>
          {relationships.generates.map(task => (
            <TaskLink key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows related tasks grouped by relationship type
- [ ] Clickable links to navigate to related tasks
- [ ] Visual indicators for relationship types
- [ ] Handles circular dependencies gracefully

### 2.3 Filtering & Views

#### Task 2.3.1: Filter System
**File:** `components/FilterBar.jsx`

```jsx
import React from 'react';

export default function FilterBar({ filters, onFilterChange }) {
  return (
    <div className="flex gap-4 mb-6 p-4 bg-white rounded-lg shadow">
      {/* Filter by dimension */}
      <select
        value={filters.dimension || ''}
        onChange={(e) => onFilterChange({ ...filters, dimension: e.target.value })}
        className="px-3 py-2 border rounded"
      >
        <option value="">All Dimensions</option>
        <option value="content">Content</option>
        <option value="practice">Practice</option>
        <option value="infrastructure">Infrastructure</option>
        <option value="marketing">Marketing</option>
        <option value="community">Community</option>
      </select>

      {/* Filter by status */}
      <select
        value={filters.status || ''}
        onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
        className="px-3 py-2 border rounded"
      >
        <option value="">All Status</option>
        <option value="In Progress">In Progress</option>
        <option value="Done">Done</option>
        <option value="Blocked">Blocked</option>
      </select>

      {/* Search */}
      <input
        type="text"
        placeholder="Search tasks..."
        value={filters.search || ''}
        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        className="flex-1 px-3 py-2 border rounded"
      />
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Filter by dimension tags
- [ ] Filter by status
- [ ] Text search across title/description
- [ ] Filters can be combined
- [ ] Clear all filters button

---

## Phase 3: Content-Practice Integration

**Goal:** Bridge between doing and documenting

### 3.1 Practice Insights Capture

#### Task 3.1.1: Quick Capture Component
**File:** `components/QuickCapture.jsx`

```jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function QuickCapture() {
  const [insight, setInsight] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  async function handleCapture() {
    if (!insight.trim()) return;

    // Create task with practice tag
    await axios.post('http://localhost:3001/api/tasks', {
      title: `Practice Insight: ${insight.substring(0, 50)}${insight.length > 50 ? '...' : ''}`,
      description: insight,
      tags: ['practice', 'insight']
    });

    setInsight('');
    setIsOpen(false);
  }

  return (
    <div className="fixed bottom-6 right-6">
      {isOpen ? (
        <div className="bg-white p-4 rounded-lg shadow-lg w-80">
          <h3 className="font-semibold mb-2">Capture Practice Insight</h3>
          <textarea
            className="w-full p-2 border rounded"
            value={insight}
            onChange={(e) => setInsight(e.target.value)}
            placeholder="What did you discover?"
            rows={4}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleCapture} className="px-4 py-2 bg-green-500 text-white rounded">
              Capture
            </button>
            <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-gray-300 rounded">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="px-6 py-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600"
        >
          💡 Quick Insight
        </button>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Floating action button always accessible
- [ ] Quick capture without leaving current view
- [ ] Automatically tags as practice insight
- [ ] Keyboard shortcut to open (e.g., Cmd+I)

### 3.2 Bi-Directional Linking

#### Task 3.2.1: Content-Practice Links
**File:** `components/ContentPracticeLinker.jsx`

```jsx
// Component to link content tasks with practice tasks
// Shows which book chapter relates to which practice
// Shows which practice generated which content

export default function ContentPracticeLinker({ taskId, task }) {
  const [linkedTasks, setLinkedTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  async function searchTasks(query) {
    // Search for tasks to link
    const response = await axios.get(`/api/tasks/search?q=${query}`);
    setSearchResults(response.data);
  }

  async function linkTask(targetTaskId) {
    // Create bidirectional link
    const relationshipType = task.tags.includes('content') ? 'generated-by' : 'generates';
    await axios.post('/api/relationships', {
      fromTaskId: taskId,
      toTaskId: targetTaskId,
      type: relationshipType
    });
    fetchLinkedTasks();
  }

  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">
        {task.tags.includes('content') ? 'Based on Practice' : 'Generates Content'}
      </h4>
      
      {/* Existing links */}
      <div className="space-y-2 mb-4">
        {linkedTasks.map(linked => (
          <LinkedTaskCard key={linked.id} task={linked} />
        ))}
      </div>

      {/* Add new link */}
      <input
        type="text"
        placeholder="Search to link..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          searchTasks(e.target.value);
        }}
        className="w-full px-3 py-2 border rounded"
      />
      
      {searchResults.length > 0 && (
        <div className="mt-2 bg-white border rounded shadow-lg">
          {searchResults.map(result => (
            <button
              key={result.id}
              onClick={() => linkTask(result.id)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50"
            >
              {result.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows existing content-practice links
- [ ] Search to find tasks to link
- [ ] Bidirectional relationships (content ↔ practice)
- [ ] Visual distinction for link types

---

## Phase 4: Launch Orchestration

**Goal:** Timeline view for 2026 launch sequence

### 4.1 Timeline Data Structure

#### Task 4.1.1: Phase & Milestone Backend
**File:** `/backend/models/LaunchPhase.js`

```javascript
// Define launch phases structure
const LAUNCH_PHASES = {
  PHASE_1: {
    name: 'Recognition Filters',
    quarter: 'Q1 2026',
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    milestones: [
      {
        id: 'amazon-books',
        name: 'Amazon Books Published',
        description: 'Genesis Unveiled and Inner Allies live on Amazon',
        targetDate: '2026-01-15',
        status: 'planned'
      },
      {
        id: 'stone-launch',
        name: 'Stone Initiative Launch',
        description: 'Viral stone practice materials released',
        targetDate: '2026-02-01',
        status: 'planned'
      },
      {
        id: 'free-content',
        name: 'Free Content Ecosystem',
        description: 'Blog posts, articles, Substack series established',
        targetDate: '2026-03-01',
        status: 'planned'
      }
    ]
  },
  PHASE_2: {
    name: 'BOPA Foundation',
    quarter: 'Q2 2026',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    milestones: [
      {
        id: 'influencer-partnerships',
        name: 'Influencer Partnerships',
        description: 'Begin BOPA strategy with aligned creators',
        targetDate: '2026-04-15',
        status: 'planned'
      },
      {
        id: 'facilitator-tier',
        name: 'Facilitator Tier Opening',
        description: 'First 20-30 facilitators recruited',
        targetDate: '2026-05-01',
        status: 'planned'
      },
      {
        id: 'substack-community',
        name: 'Substack Community Active',
        description: 'Engaged community on Substack platform',
        targetDate: '2026-06-01',
        status: 'planned'
      }
    ]
  },
  PHASE_3: {
    name: 'Infrastructure Deployment',
    quarter: 'Q3-Q4 2026',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    milestones: [
      {
        id: 'custom-platforms',
        name: 'Custom Platforms Launch',
        description: 'justbemindful.life and innerallies.net live',
        targetDate: '2026-09-01',
        status: 'planned'
      },
      {
        id: 'full-ecosystem',
        name: 'Full Community Ecosystem',
        description: 'All three tiers operational',
        targetDate: '2026-10-15',
        status: 'planned'
      },
      {
        id: 'co-creator-tier',
        name: 'Co-Creator Tier Activation',
        description: 'Founding co-creators producing content',
        targetDate: '2026-11-01',
        status: 'planned'
      }
    ]
  }
};

// Backend routes to access phases
app.get('/api/launch/phases', (req, res) => {
  res.json(LAUNCH_PHASES);
});

app.get('/api/launch/milestones', (req, res) => {
  const allMilestones = Object.values(LAUNCH_PHASES)
    .flatMap(phase => phase.milestones.map(m => ({
      ...m,
      phase: phase.name,
      quarter: phase.quarter
    })));
  res.json(allMilestones);
});
```

**Acceptance Criteria:**
- [ ] Phases defined with quarters
- [ ] Milestones have target dates
- [ ] Status tracking (planned/in-progress/done)
- [ ] API endpoints to fetch phase data

#### Task 4.1.2: Link Tasks to Milestones
**File:** `/backend/blueClient.js`

```javascript
async linkTaskToMilestone(taskId, milestoneId) {
  // Associate task with launch milestone
  // Store in task metadata or custom field
}

async getTasksForMilestone(milestoneId) {
  // Fetch all tasks contributing to a milestone
}

async getMilestoneProgress(milestoneId) {
  // Calculate % complete based on linked tasks
}
```

**Acceptance Criteria:**
- [ ] Tasks can be assigned to milestones
- [ ] One task can contribute to multiple milestones
- [ ] Progress calculation based on task completion
- [ ] Deadline warnings for milestones

### 4.2 Timeline Visualization

#### Task 4.2.1: Timeline View Component
**File:** `components/TimelineView.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TimelineView() {
  const [phases, setPhases] = useState([]);
  const [selectedPhase, setSelectedPhase] = useState(null);

  useEffect(() => {
    fetchPhases();
  }, []);

  async function fetchPhases() {
    const response = await axios.get('http://localhost:3001/api/launch/phases');
    setPhases(Object.values(response.data));
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">2026 Launch Timeline</h1>
      
      <div className="space-y-6">
        {phases.map(phase => (
          <PhaseCard 
            key={phase.name} 
            phase={phase}
            isExpanded={selectedPhase === phase.name}
            onToggle={() => setSelectedPhase(
              selectedPhase === phase.name ? null : phase.name
            )}
          />
        ))}
      </div>
    </div>
  );
}

function PhaseCard({ phase, isExpanded, onToggle }) {
  return (
    <div className="bg-white rounded-lg shadow">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-50"
      >
        <div>
          <h2 className="text-xl font-semibold">{phase.name}</h2>
          <p className="text-gray-600">{phase.quarter}</p>
        </div>
        <span className="text-2xl">{isExpanded ? '−' : '+'}</span>
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="space-y-4 mt-4">
            {phase.milestones.map(milestone => (
              <MilestoneCard key={milestone.id} milestone={milestone} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MilestoneCard({ milestone }) {
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchMilestoneTasks();
  }, [milestone.id]);

  async function fetchMilestoneTasks() {
    const response = await axios.get(
      `http://localhost:3001/api/launch/milestones/${milestone.id}/tasks`
    );
    setTasks(response.data);
    
    const completed = response.data.filter(t => t.status === 'Done').length;
    setProgress(response.data.length > 0 ? (completed / response.data.length) * 100 : 0);
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold">{milestone.name}</h3>
          <p className="text-sm text-gray-600">{milestone.description}</p>
        </div>
        <span className="text-sm text-gray-500">
          {new Date(milestone.targetDate).toLocaleDateString()}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{tasks.length} tasks</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Tasks preview */}
      {tasks.length > 0 && (
        <div className="mt-3 space-y-1">
          {tasks.slice(0, 3).map(task => (
            <div key={task.id} className="text-sm text-gray-700">
              • {task.title}
            </div>
          ))}
          {tasks.length > 3 && (
            <div className="text-sm text-gray-500">
              + {tasks.length - 3} more tasks
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Shows all three phases
- [ ] Expandable milestone cards
- [ ] Progress bars for each milestone
- [ ] Target dates clearly visible
- [ ] Current quarter highlighted

### 4.3 Readiness Dashboard

#### Task 4.3.1: Readiness Signals
**File:** `components/ReadinessDashboard.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ReadinessDashboard() {
  const [readiness, setReadiness] = useState({});

  useEffect(() => {
    calculateReadiness();
  }, []);

  async function calculateReadiness() {
    // Check readiness for next phase
    const response = await axios.get('http://localhost:3001/api/launch/readiness');
    setReadiness(response.data);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ReadinessCard
        title="Content Ready"
        items={readiness.content || []}
        requiredCount={10}
      />
      <ReadinessCard
        title="Platform Ready"
        items={readiness.platform || []}
        requiredCount={5}
      />
      <ReadinessCard
        title="Audience Ready"
        items={readiness.audience || []}
        requiredCount={3}
      />
    </div>
  );
}

function ReadinessCard({ title, items, requiredCount }) {
  const completedCount = items.filter(i => i.completed).length;
  const isReady = completedCount >= requiredCount;

  return (
    <div className={`p-6 rounded-lg ${isReady ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'} border-2`}>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <div className="text-3xl font-bold mb-4">
        {completedCount}/{requiredCount}
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span>{item.completed ? '✓' : '○'}</span>
            <span className={item.completed ? 'text-green-700' : 'text-gray-600'}>
              {item.name}
            </span>
          </div>
        ))}
      </div>
      {isReady && (
        <div className="mt-4 px-3 py-2 bg-green-500 text-white rounded text-center font-semibold">
          READY
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Three readiness categories (content/platform/audience)
- [ ] Checklist for each category
- [ ] Visual indicators (ready/not ready)
- [ ] Updates in real-time as tasks complete

---

## Phase 5: Polish & Optimization

**Goal:** Production-ready with excellent UX

### 5.1 Performance Optimization

#### Task 5.1.1: Implement Caching Strategy
```javascript
// Frontend: React Query for data caching
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Backend: Add caching layer
const cache = new Map();

app.get('/api/tasks', (req, res) => {
  const cacheKey = 'tasks';
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  // ... fetch data ...
  cache.set(cacheKey, data);
  res.json(data);
});
```

**Acceptance Criteria:**
- [ ] Reduces API calls by 70%+
- [ ] Smart cache invalidation
- [ ] Optimistic updates for instant UX
- [ ] Background refresh for stale data

#### Task 5.1.2: Lazy Loading & Code Splitting
```javascript
// Frontend routing with lazy loading
import { lazy, Suspense } from 'react';

const TaskList = lazy(() => import('./components/TaskList'));
const TimelineView = lazy(() => import('./components/TimelineView'));
const ReadinessDashboard = lazy(() => import('./components/ReadinessDashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<TaskList />} />
        <Route path="/timeline" element={<TimelineView />} />
        <Route path="/readiness" element={<ReadinessDashboard />} />
      </Routes>
    </Suspense>
  );
}
```

**Acceptance Criteria:**
- [ ] Initial bundle < 200KB
- [ ] Components load on-demand
- [ ] Smooth loading states
- [ ] No layout shift during loading

### 5.2 Error Handling & Recovery

#### Task 5.2.1: Offline Support
```javascript
// Service Worker for offline functionality
// Register in frontend/src/index.jsx

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// sw.js - Cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

**Acceptance Criteria:**
- [ ] Works completely offline using local mode
- [ ] Queues changes when offline
- [ ] Syncs when connection restored
- [ ] Clear offline indicator in UI

#### Task 5.2.2: Error Boundaries
```jsx
// Frontend error handling
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-red-600">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Acceptance Criteria:**
- [ ] Graceful error display
- [ ] Error logging to console
- [ ] Recovery actions available
- [ ] Doesn't crash entire app

### 5.3 Keyboard Shortcuts

#### Task 5.3.1: Global Hotkeys
```javascript
// Implement keyboard shortcuts
useEffect(() => {
  function handleKeyDown(e) {
    // Cmd/Ctrl + K: Quick search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    
    // Cmd/Ctrl + N: New task
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      openNewTaskForm();
    }
    
    // Cmd/Ctrl + I: Quick insight
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      openQuickCapture();
    }
    
    // Cmd/Ctrl + /: Show shortcuts
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      showShortcutsModal();
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

**Acceptance Criteria:**
- [ ] Common actions have shortcuts
- [ ] Shortcuts work globally
- [ ] Modal showing all shortcuts (Cmd+/)
- [ ] Mac/Windows compatible

### 5.4 Export & Backup

#### Task 5.4.1: Data Export
```javascript
// Backend export endpoint
app.get('/api/export', async (req, res) => {
  const format = req.query.format || 'json';
  
  const data = {
    tasks: await blueClient.getTasks(),
    tags: await blueClient.getTags(),
    relationships: await blueClient.getAllRelationships(),
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  if (format === 'json') {
    res.json(data);
  } else if (format === 'csv') {
    // Convert to CSV
    const csv = convertToCSV(data.tasks);
    res.setHeader('Content-Type', 'text/csv');
    res.send(csv);
  } else if (format === 'markdown') {
    // Convert to Markdown
    const md = convertToMarkdown(data);
    res.setHeader('Content-Type', 'text/markdown');
    res.send(md);
  }
});

// Frontend export button
async function handleExport(format) {
  const response = await axios.get(`/api/export?format=${format}`, {
    responseType: 'blob'
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `pmt-export-${Date.now()}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
```

**Acceptance Criteria:**
- [ ] Export to JSON, CSV, Markdown
- [ ] Includes all data (tasks, tags, relationships)
- [ ] Timestamped filenames
- [ ] One-click download

---

## Technical Specifications

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  TaskList   │  │  Timeline    │  │  Readiness    │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│         │                 │                  │           │
│         └─────────────────┴──────────────────┘           │
│                          │                               │
│                   ┌──────▼──────┐                        │
│                   │  API Client │                        │
│                   └──────┬──────┘                        │
└──────────────────────────┼──────────────────────────────┘
                           │
                  HTTP (localhost:3001)
                           │
┌──────────────────────────▼──────────────────────────────┐
│                 Backend (Express)                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │              BlueClient                             │ │
│  │  ┌──────────────┐        ┌──────────────┐         │ │
│  │  │ Blue.cc API  │        │  Local JSON  │         │ │
│  │  │   (Cloud)    │◄──────►│   (Fallback) │         │ │
│  │  └──────────────┘        └──────────────┘         │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### File Structure

```
PMT/
├── backend/
│   ├── server.js                 # Express server
│   ├── blueClient.js            # Blue.cc API client
│   ├── models/
│   │   ├── LaunchPhase.js       # Phase definitions
│   │   └── Relationship.js      # Task relationships
│   ├── routes/
│   │   ├── tasks.js             # Task CRUD endpoints
│   │   ├── tags.js              # Tag management
│   │   ├── launch.js            # Launch timeline
│   │   └── export.js            # Data export
│   ├── middleware/
│   │   ├── cache.js             # Caching layer
│   │   └── errorHandler.js      # Error handling
│   ├── .env                     # Environment variables
│   ├── tasks.json               # Local storage
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app component
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TaskList.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── CreateTaskForm.jsx
│   │   │   ├── TagSelector.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── QuickCapture.jsx
│   │   │   ├── RelationshipMap.jsx
│   │   │   ├── ContentPracticeLinker.jsx
│   │   │   ├── TimelineView.jsx
│   │   │   ├── ReadinessDashboard.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── hooks/
│   │   │   ├── useTasks.js
│   │   │   ├── useTags.js
│   │   │   └── useKeyboardShortcuts.js
│   │   ├── utils/
│   │   │   ├── api.js           # API client
│   │   │   └── helpers.js
│   │   ├── styles/
│   │   │   └── index.css        # Tailwind + custom
│   │   └── main.jsx             # Entry point
│   ├── public/
│   │   ├── sw.js                # Service worker
│   │   └── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docs/
│   ├── VISION_V1.md             # Product vision
│   ├── SUCCESS.md               # Setup success
│   └── API.md                   # API documentation
│
└── README.md
```

---

## API Integration Details

### Blue.cc GraphQL Queries

#### Get All Tasks
```graphql
query GetTodos($todoListId: ID!) {
  todoList(id: $todoListId) {
    todos {
      id
      title
      text
      done
      position
      tags {
        id
        name
      }
      createdAt
      updatedAt
    }
  }
}
```

#### Create Task
```graphql
mutation CreateTodo($input: CreateTodoInput!) {
  createTodo(input: $input) {
    id
    title
    text
    done
    position
    tags {
      id
      name
    }
  }
}
```

#### Update Task
```graphql
mutation UpdateTodo($id: ID!, $input: EditTodoInput!) {
  editTodo(id: $id, input: $input) {
    id
    title
    text
    done
    tags {
      id
      name
    }
  }
}
```

#### Delete Task
```graphql
mutation DeleteTodo($id: ID!) {
  deleteTodo(id: $id) {
    id
  }
}
```

### REST API Endpoints (Your Backend)

```
GET    /api/health                     # Health check
GET    /api/workspaces                 # List workspaces
GET    /api/tasks                      # List all tasks
POST   /api/tasks                      # Create task
PUT    /api/tasks/:id                  # Update task
DELETE /api/tasks/:id                  # Delete task
GET    /api/tags                       # List all tags
POST   /api/tags                       # Create tag
POST   /api/tasks/:id/tags             # Add tag to task
DELETE /api/tasks/:id/tags/:tag        # Remove tag
GET    /api/relationships              # List relationships
POST   /api/relationships              # Create relationship
GET    /api/tasks/:id/relationships    # Get task relationships
GET    /api/launch/phases              # Get launch phases
GET    /api/launch/milestones          # Get milestones
GET    /api/launch/milestones/:id/tasks  # Tasks for milestone
GET    /api/launch/readiness           # Readiness signals
GET    /api/export?format=json|csv|md  # Export data
POST   /api/graphql                    # Custom GraphQL queries
```

---

## Database Schema

### Local Storage Schema (tasks.json)

```json
{
  "tasks": [
    {
      "id": "local-123456789",
      "title": "Write Chapter 3: The Body as Classroom",
      "description": "Expand on shower experience from personal story",
      "status": "In Progress",
      "tags": ["content", "book-1"],
      "priority": "High",
      "dueDate": null,
      "createdAt": "2026-01-18T10:30:00Z",
      "updatedAt": "2026-01-18T15:45:00Z",
      "relationships": [
        {
          "taskId": "local-987654321",
          "type": "generated-by",
          "description": "Based on walking practice insights"
        }
      ],
      "milestoneId": "amazon-books"
    }
  ],
  "tags": [
    {
      "name": "content",
      "color": "#3B82F6",
      "type": "dimension"
    },
    {
      "name": "practice",
      "color": "#10B981",
      "type": "dimension"
    },
    {
      "name": "book-1",
      "color": "#6366F1",
      "type": "custom"
    }
  ],
  "relationships": [
    {
      "fromTaskId": "local-123456789",
      "toTaskId": "local-987654321",
      "type": "generated-by",
      "createdAt": "2026-01-18T16:00:00Z"
    }
  ]
}
```

### Blue.cc Mapping

```javascript
// Local → Blue.cc
{
  title: "Task title",
  description: "Description"
} 
→ 
{
  title: "Task title",
  text: "Description",
  todoListId: "xxx",
  position: 65535,
  tags: ["content", "practice"]
}
```

---

## Component Architecture

### State Management Strategy

**Option 1: React Context (Simpler)**
```javascript
// contexts/AppContext.jsx
const AppContext = createContext();

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [filters, setFilters] = useState({});

  return (
    <AppContext.Provider value={{ tasks, setTasks, tags, setTags, filters, setFilters }}>
      {children}
    </AppContext.Provider>
  );
}
```

**Option 2: React Query (Recommended)**
```javascript
// Cleaner, automatic caching, optimistic updates
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useTasks() {
  const queryClient = useQueryClient();
  
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks
  });

  const createTask = useMutation({
    mutationFn: createTaskAPI,
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    }
  });

  return { tasks, isLoading, createTask };
}
```

### Styling Approach

**Tailwind CSS with Custom Theme**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'dimension-content': '#3B82F6',
        'dimension-practice': '#10B981',
        'dimension-infrastructure': '#8B5CF6',
        'dimension-marketing': '#F59E0B',
        'dimension-community': '#EC4899'
      }
    }
  }
}
```

---

## Testing Strategy

### Backend Tests

```javascript
// tests/api.test.js
describe('Task API', () => {
  test('GET /api/tasks returns all tasks', async () => {
    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/tasks creates a new task', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task', description: 'Test' });
    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Task');
  });

  test('Falls back to local mode when Blue.cc fails', async () => {
    // Mock Blue.cc failure
    blueClient.useLocalMode = true;
    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(200);
  });
});
```

### Frontend Tests

```javascript
// components/__tests__/TaskCard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../TaskCard';

test('renders task title and description', () => {
  const task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description'
  };
  render(<TaskCard task={task} />);
  expect(screen.getByText('Test Task')).toBeInTheDocument();
  expect(screen.getByText('Test Description')).toBeInTheDocument();
});

test('enters edit mode when edit button clicked', () => {
  const task = { id: '1', title: 'Test' };
  render(<TaskCard task={task} />);
  fireEvent.click(screen.getByText('Edit'));
  expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
});
```

### Manual Testing Checklist

- [ ] Create task (cloud mode)
- [ ] Create task (local mode)
- [ ] Edit task (cloud mode)
- [ ] Edit task (local mode)
- [ ] Delete task (both modes)
- [ ] Add tags to task
- [ ] Filter by tags
- [ ] Search tasks
- [ ] Link tasks with relationships
- [ ] View timeline
- [ ] Check readiness dashboard
- [ ] Export data (JSON/CSV/Markdown)
- [ ] Offline → Online sync
- [ ] Keyboard shortcuts work
- [ ] Mobile responsive
- [ ] Error handling graceful

---

## Implementation Phases - Detailed Timeline

### Week 1: Foundation (Phase 1.1 - 1.2)
**Days 1-2:**
- Set up backend routes for tags
- Implement tag CRUD in blueClient.js
- Test Blue.cc tag sync

**Days 3-5:**
- Build Layout, Header, Sidebar
- Create TaskList component
- Implement TaskCard with inline editing
- Build CreateTaskForm

**Days 6-7:**
- Connect frontend to backend
- Test full CRUD flow
- Debug sync issues
- Polish UI styling

**Deliverable:** Working task management with cloud sync ✅

### Week 2: Multi-Dimensional System (Phase 2)
**Days 1-3:**
- Backend tag system with dimensions
- Frontend TagSelector component
- FilterBar with dimension filtering
- Test tag creation and filtering

**Days 4-5:**
- Implement relationship data model
- Backend relationship endpoints
- RelationshipMap component
- Test bidirectional links

**Days 6-7:**
- Advanced filtering (combine dimension + status + search)
- Bulk operations (multi-select, bulk tag)
- Performance optimization
- Bug fixes

**Deliverable:** Multi-dimensional tagging and relationships ✅

### Week 3: Content-Practice Integration (Phase 3)
**Days 1-2:**
- QuickCapture floating button
- Practice insight auto-tagging
- Test rapid capture flow

**Days 3-5:**
- ContentPracticeLinker component
- Search functionality for linking
- Bidirectional relationship display
- Test content ↔ practice flow

**Days 6-7:**
- Practice journal view (filtered list of insights)
- Auto-suggest related content when creating practice tasks
- Polish UX for linking workflow

**Deliverable:** Seamless content-practice bridge ✅

### Week 4: Launch Orchestration (Phase 4)
**Days 1-2:**
- Define launch phases in backend
- Milestone data structure
- API endpoints for phases/milestones

**Days 3-5:**
- TimelineView component
- PhaseCard and MilestoneCard
- Progress calculation
- Task-to-milestone linking

**Days 6-7:**
- ReadinessDashboard component
- Readiness calculation logic
- Visual indicators
- Polish timeline UI

**Deliverable:** Full launch timeline view ✅

### Week 5: Polish & Optimization (Phase 5)
**Days 1-2:**
- React Query integration
- Backend caching layer
- Optimistic updates
- Performance testing

**Days 3-4:**
- Offline support (service worker)
- Error boundaries
- Retry logic
- Sync queue for offline changes

**Days 5-7:**
- Keyboard shortcuts
- Export functionality
- Mobile responsive polish
- Accessibility improvements
- Final bug fixes

**Deliverable:** Production-ready v1.0 ✅

---

## Success Criteria

### Technical
- [ ] 100% feature parity between cloud and local modes
- [ ] < 2 second page load time
- [ ] Works offline completely
- [ ] Zero data loss during sync failures
- [ ] Mobile responsive (works on phone/tablet)

### Functional
- [ ] Can create/edit/delete tasks
- [ ] Tag-based filtering works
- [ ] Relationships display correctly
- [ ] Timeline shows accurate progress
- [ ] Readiness dashboard updates in real-time
- [ ] Export includes all data

### UX
- [ ] No layout shifts or jank
- [ ] Smooth animations
- [ ] Clear error messages
- [ ] Keyboard shortcuts feel natural
- [ ] Mobile touch targets ≥ 44px

### Business
- [ ] Tracks all dimensions of work (content/practice/infrastructure)
- [ ] Shows 2026 launch timeline clearly
- [ ] Readiness signals guide decisions
- [ ] Content-practice links visible
- [ ] Serves as infrastructure for the work

---

## Deployment Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance audit (Lighthouse)
- [ ] Security audit
- [ ] Backup procedures tested
- [ ] Documentation complete

### Environment Setup
- [ ] Production .env configured
- [ ] Blue.cc production credentials
- [ ] Error logging configured
- [ ] Analytics (optional) configured

### Launch
- [ ] Deploy backend to hosting (Railway/Render/Fly.io)
- [ ] Deploy frontend to hosting (Vercel/Netlify)
- [ ] Set up custom domain (optional)
- [ ] SSL certificate active
- [ ] Monitor error logs
- [ ] Test production environment

### Post-Launch
- [ ] Monitor performance
- [ ] Track error rates
- [ ] Gather user feedback (from yourself!)
- [ ] Plan v1.1 features
- [ ] Regular backups scheduled

---

## Next Steps After V1

**Potential V2 Features:**
1. **AI Integration** - Librarian MVP for intelligent content assistance
2. **Community Platform Sync** - Connect with Heartbeat/GoBrunch
3. **Advanced Analytics** - Track velocity, burndown, completion rates
4. **Mobile Apps** - Native iOS/Android for on-the-go capture
5. **Collaboration** - Multi-user support for co-creators
6. **Blockchain Smart Contracts** - True decentralization for the movement
7. **Voice Capture** - Speak practice insights, auto-transcribe
8. **Calendar Integration** - Sync milestones with Google Calendar
9. **Notification System** - Reminders for deadlines
10. **Version History** - Track how tasks evolve over time

---

## Resources & References

### Documentation
- Blue.cc API: https://www.blue.cc/en/api/start-guide/introduction
- React: https://react.dev/
- Vite: https://vitejs.dev/
- Tailwind CSS: https://tailwindcss.com/
- React Query: https://tanstack.com/query/latest

### Design Inspiration
- Linear: https://linear.app (clean task UI)
- Notion: https://notion.so (flexible views)
- Height: https://height.app (timeline visualization)

### Development Tools
- VS Code extensions: ES7 snippets, Tailwind IntelliSense, Prettier
- API testing: Postman or Insomnia
- GraphQL testing: Blue.cc Playground
- Browser DevTools: React Developer Tools

---

## Support & Contact

For questions or issues during development:
1. Check Blue.cc API docs
2. Review error logs in backend console
3. Test with curl commands
4. Use Blue.cc GraphQL Playground for query testing
5. Refer back to VISION_V1.md for product direction

---

**This plan provides everything needed for Claude CLI or Gemini CLI to build the complete Inner Allies PMT v1.0. Each task is specific, includes code examples, and has clear acceptance criteria. The architecture is proven (already working backend!), and the vision is clear.**

**Ready to build infrastructure for awakening to spread!** 🌟
