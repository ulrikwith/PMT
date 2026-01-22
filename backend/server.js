import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import blueClient from './blueClient.js';
import { LAUNCH_PHASES } from './launchData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PMT Backend is running',
    mode: 'cloud'
  });
});

// --- Launch Routes ---

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

app.get('/api/launch/milestones/:id/tasks', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.getTasksForMilestone(id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.get('/api/launch/milestones/:id/progress', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.getMilestoneProgress(id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/api/launch/milestones/:id/link', async (req, res) => {
  const { id } = req.params;
  const { taskId } = req.body;
  const result = await blueClient.linkTaskToMilestone(taskId, id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.get('/api/launch/readiness', async (req, res) => {
  const result = await blueClient.calculateReadiness();
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- Export Route ---

app.get('/api/export', async (req, res) => {
  const tasks = await blueClient.getTasks();
  const tags = await blueClient.getTags();
  const relationships = await blueClient.getAllRelationships();

  const data = {
    tasks: tasks.success ? tasks.data : [],
    tags: tags.success ? tags.data : [],
    relationships: relationships.success ? relationships.data : [],
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  const format = req.query.format || 'json';

  if (format === 'json') {
    res.header('Content-Type', 'application/json');
    res.header('Content-Disposition', `attachment; filename="pmt-export-${Date.now()}.json"`);
    res.json(data);
  } else {
    res.status(400).json({ error: 'Only JSON export is currently supported' });
  }
});

// --- Workspaces ---

app.get('/api/workspaces', async (req, res) => {
  const result = await blueClient.getWorkspaces();
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- Tasks ---

app.get('/api/tasks', async (req, res) => {
  const filters = req.query;
  const result = await blueClient.getTasks(filters);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required' });
  }
  if (title.length > 200) {
    return res.status(400).json({ error: 'Task title must be 200 characters or less' });
  }
  const result = await blueClient.createTask(req.body);
  if (result.success) {
    res.status(201).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.updateTask(id, req.body);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const permanent = req.query.permanent === 'true';
  const result = await blueClient.deleteTask(id, permanent);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- Trash Management ---

app.get('/api/trash', async (req, res) => {
  const result = await blueClient.getDeletedTasks();
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/api/trash/:id/restore', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.restoreTask(id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/trash', async (req, res) => {
  const olderThanDays = req.query.olderThanDays ? parseInt(req.query.olderThanDays) : null;
  const result = await blueClient.emptyTrash(olderThanDays);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/trash/:id', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.deleteTask(id, true); // permanent delete
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- Tags ---

app.get('/api/tags', async (req, res) => {
  const result = await blueClient.getTags();
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/api/tags', async (req, res) => {
  const { name, color } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Tag name is required' });
  }
  const result = await blueClient.createTag(name.trim(), color);
  if (result.success) {
    res.status(201).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- Relationships ---

app.get('/api/relationships', async (req, res) => {
  const result = await blueClient.getAllRelationships();
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/api/relationships', async (req, res) => {
  const { fromTaskId, toTaskId, type } = req.body;
  if (!fromTaskId || !toTaskId || !type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const result = await blueClient.createTaskRelationship(fromTaskId, toTaskId, type);
  if (result.success) {
    res.status(201).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.get('/api/tasks/:id/relationships', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.getTaskRelationships(id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/relationships/:id', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.deleteRelationship(id);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- GraphQL Passthrough ---

app.post('/api/graphql', async (req, res) => {
  const { query, variables } = req.body;
  const result = await blueClient.executeQuery(query, variables);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, async () => {
  console.log(`PMT Backend running on http://localhost:${PORT}`);
  await blueClient.testConnection();
});
