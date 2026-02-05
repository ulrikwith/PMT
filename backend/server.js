import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import blueClient from './blueClient.js';
import { LAUNCH_PHASES } from './launchData.js';
import authRoutes from './routes/auth.js';
import wpWebhookRoutes from './routes/wp-webhook.js';
import { authenticateToken } from './middleware/auth.js';
import assetService from './services/assetService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Global Middleware ────────────────────────────────────────

app.use(
  cors({
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true, // Required for Supabase auth cookies
  })
);
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ─── Public Routes ────────────────────────────────────────────

// Auth Routes (login, register, etc. — no middleware needed)
app.use('/api/auth', authRoutes);

// WordPress/WooCommerce Webhook (public — verified by HMAC signature)
app.use('/api/webhooks/woocommerce', wpWebhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PMT Backend is running',
    mode: 'cloud',
  });
});

// ─── Protected Routes (all require authentication) ───────────

// Apply authenticateToken middleware to all routes below
app.use('/api', authenticateToken);

// --- Launch Routes ---

app.get('/api/launch/phases', (req, res) => {
  res.json(LAUNCH_PHASES);
});

app.get('/api/launch/milestones', (req, res) => {
  const allMilestones = Object.values(LAUNCH_PHASES).flatMap((phase) =>
    phase.milestones.map((m) => ({
      ...m,
      phase: phase.name,
      quarter: phase.quarter,
    }))
  );
  res.json(allMilestones);
});

app.get('/api/launch/milestones/:id/tasks', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.getTasksForMilestone(req.user.todoListId, id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.get('/api/launch/milestones/:id/progress', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.getMilestoneProgress(req.user.todoListId, id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/api/launch/milestones/:id/link', async (req, res) => {
  const { id } = req.params;
  const { taskId } = req.body;
  const result = await blueClient.linkTaskToMilestone(req.user.todoListId, taskId, id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.get('/api/launch/readiness', async (req, res) => {
  const result = await blueClient.calculateReadiness(req.user.todoListId);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- Export Route ---

app.get('/api/export', async (req, res) => {
  const tasks = await blueClient.getTasks(req.user.todoListId);
  const tags = await blueClient.getTags();
  const relationships = await blueClient.getAllRelationships(req.user.todoListId);

  const data = {
    tasks: tasks.success ? tasks.data : [],
    tags: tags.success ? tags.data : [],
    relationships: relationships.success ? relationships.data : [],
    exportDate: new Date().toISOString(),
    version: '1.0',
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
  const result = await blueClient.getTasks(req.user.todoListId, filters);
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
  const result = await blueClient.createTask(req.user.todoListId, req.body);
  if (result.success) {
    res.status(201).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.updateTask(req.user.todoListId, id, req.body);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const permanent = req.query.permanent === 'true';
  const result = await blueClient.deleteTask(req.user.todoListId, id, permanent);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- Trash Management ---

app.get('/api/trash', async (req, res) => {
  const result = await blueClient.getDeletedTasks(req.user.todoListId);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/api/trash/:id/restore', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.restoreTask(req.user.todoListId, id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/trash', async (req, res) => {
  let olderThanDays = null;
  if (req.query.olderThanDays) {
    olderThanDays = parseInt(req.query.olderThanDays, 10);
    if (isNaN(olderThanDays) || olderThanDays < 0) {
      return res.status(400).json({ error: 'olderThanDays must be a non-negative integer' });
    }
  }
  const result = await blueClient.emptyTrash(req.user.todoListId, olderThanDays);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/trash/:id', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.deleteTask(req.user.todoListId, id, true); // permanent delete
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
  const result = await blueClient.getAllRelationships(req.user.todoListId);
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
  const result = await blueClient.createTaskRelationship(req.user.todoListId, fromTaskId, toTaskId, type);
  if (result.success) {
    res.status(201).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.get('/api/tasks/:id/relationships', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.getTaskRelationships(req.user.todoListId, id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/relationships/:id', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.deleteRelationship(req.user.todoListId, id);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- Visions ---

app.get('/api/visions', async (req, res) => {
  const result = await blueClient.getAllVisions(req.user.todoListId);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.put('/api/visions/:dimension', async (req, res) => {
  const { dimension } = req.params;
  const { data, elementId } = req.body;
  if (!data) {
    return res.status(400).json({ error: 'Vision data is required' });
  }
  const result = await blueClient.saveVision(req.user.todoListId, dimension, data, elementId || null);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/visions/:dimension', async (req, res) => {
  const { dimension } = req.params;
  const { elementId, type } = req.query;
  const result = await blueClient.deleteVision(req.user.todoListId, dimension, elementId || null, type || null);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- Reviews ---

app.get('/api/reviews', async (req, res) => {
  const result = await blueClient.getReviews(req.user.todoListId);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/api/reviews', async (req, res) => {
  const { date, answers } = req.body;
  if (!date || !answers) {
    return res.status(400).json({ error: 'Review date and answers are required' });
  }
  const result = await blueClient.saveReview(req.user.todoListId, req.body);
  if (result.success) {
    res.status(201).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- Explorations ---

app.get('/api/explorations', async (req, res) => {
  const result = await blueClient.getAllExplorations(req.user.todoListId);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/api/explorations', async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Exploration title is required' });
  }
  const result = await blueClient.saveExploration(req.user.todoListId, req.body);
  if (result.success) {
    res.status(201).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.put('/api/explorations/:id', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.updateExploration(req.user.todoListId, id, req.body);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/explorations/:id', async (req, res) => {
  const { id } = req.params;
  const result = await blueClient.deleteExploration(req.user.todoListId, id);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
});

// --- Assets ---

app.get('/api/assets', async (req, res) => {
  const result = await assetService.getAssets(req.user.id, req.query);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/api/assets', async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Asset name is required' });
  }
  const result = await assetService.createAsset(req.user.id, req.body);
  if (result.success) {
    res.status(201).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.get('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  const result = await assetService.getAsset(req.user.id, id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.put('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  const result = await assetService.updateAsset(req.user.id, id, req.body);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/assets/:id', async (req, res) => {
  const { id } = req.params;
  const result = await assetService.archiveAsset(req.user.id, id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post('/api/assets/:id/restore', async (req, res) => {
  const { id } = req.params;
  const result = await assetService.restoreAsset(req.user.id, id);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.put('/api/assets/:id/phase', async (req, res) => {
  const { id } = req.params;
  const { phase } = req.body;
  if (!phase) {
    return res.status(400).json({ error: 'Phase is required' });
  }
  const result = await assetService.updatePhase(req.user.id, id, phase);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(result.error.includes('Invalid phase') ? 400 : 500).json({ error: result.error });
  }
});

app.post('/api/assets/:id/link-task', async (req, res) => {
  const { id } = req.params;
  const { taskId } = req.body;
  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' });
  }
  const result = await assetService.linkTask(req.user.id, id, taskId);
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.delete('/api/assets/:id/link-task/:taskId', async (req, res) => {
  const { id, taskId } = req.params;
  const result = await assetService.unlinkTask(req.user.id, id, taskId);
  if (result.success) {
    res.json(result.data);
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

// ─── Error Handler ────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ─── Start Server ─────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`PMT Backend running on http://localhost:${PORT}`);
  try {
    await blueClient.testConnection();
  } catch (err) {
    console.warn('Warning: Initial connection test failed:', err.message);
    console.warn('Server will continue running. Connection will be retried on first request.');
  }
});
