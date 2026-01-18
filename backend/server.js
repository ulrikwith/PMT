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

// Simple In-Memory Cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const cacheMiddleware = (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
        return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
        console.log(`Cache hit for ${key}`);
        return res.json(cachedResponse.data);
    }

    // Capture the original send to cache it
    const originalJson = res.json;
    res.json = (body) => {
        cache.set(key, {
            timestamp: Date.now(),
            data: body
        });
        originalJson.call(res, body);
    };

    next();
};

// Clear cache on mutations
const clearCache = (req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        cache.clear(); // Simple strategy: clear all on any change
        console.log('Cache cleared due to mutation');
    }
    next();
};

app.use(cacheMiddleware);
app.use(clearCache);

// Request logging middleware (optional, for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  try {
    console.log('Health check requested');
    const mode = blueClient && blueClient.useLocalMode ? 'local' : 'cloud';
    res.json({
      status: 'ok',
      message: 'PMT Backend is running',
      mode: mode
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ error: 'Health check failed', details: error.message });
  }
});

// Launch Routes
app.get('/api/launch/phases', (req, res) => {
  try {
    res.json(LAUNCH_PHASES);
  } catch (error) {
    console.error('Error serving phases:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.get('/api/launch/milestones', (req, res) => {
  try {
    const allMilestones = Object.values(LAUNCH_PHASES)
      .flatMap(phase => phase.milestones.map(m => ({
        ...m,
        phase: phase.name,
        quarter: phase.quarter
      })));
    res.json(allMilestones);
  } catch (error) {
    console.error('Error serving milestones:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

app.get('/api/launch/milestones/:id/tasks', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await blueClient.getTasksForMilestone(id);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Milestone tasks fetch failed', details: error.message });
    }
});

app.get('/api/launch/milestones/:id/progress', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await blueClient.getMilestoneProgress(id);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Milestone progress fetch failed', details: error.message });
    }
});

app.post('/api/launch/milestones/:id/link', async (req, res) => {
    try {
        const { id } = req.params;
        const { taskId } = req.body;
        const result = await blueClient.linkTaskToMilestone(taskId, id);
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Milestone linking failed', details: error.message });
    }
});

// Mock Readiness Data -> Real Readiness Data
app.get('/api/launch/readiness', async (req, res) => {
    try {
        const result = await blueClient.calculateReadiness();
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        res.status(500).json({ error: 'Readiness calculation failed', details: error.message });
    }
});

// Export Route
app.get('/api/export', async (req, res) => {
    try {
        const tasks = await blueClient.getTasks();
        const tags = await blueClient.getTags();
        const relationships = await blueClient.getAllRelationships();
        // milestones are static or linked, we can include links
        // For simplicity, we just dump what we have access to via public methods
        
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
    } catch (error) {
        console.error('Export failed:', error);
        res.status(500).json({ error: 'Export failed', details: error.message });
    }
});

// Workspaces routes
app.get('/api/workspaces', async (req, res) => {
  try {
    const result = await blueClient.getWorkspaces();
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Workspaces fetch failed', details: error.message });
  }
});

// Tasks routes
app.get('/api/tasks', async (req, res) => {
  try {
    const filters = req.query;
    const result = await blueClient.getTasks(filters);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Tasks fetch failed', details: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Task creation failed', details: error.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blueClient.updateTask(id, req.body);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Task update failed', details: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blueClient.deleteTask(id);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Task deletion failed', details: error.message });
  }
});

// Tags routes
app.get('/api/tags', async (req, res) => {
  try {
    const result = await blueClient.getTags();
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Tags fetch failed', details: error.message });
  }
});

app.post('/api/tags', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Tag creation failed', details: error.message });
  }
});

// Relationship Routes
app.get('/api/relationships', async (req, res) => {
  try {
    const result = await blueClient.getAllRelationships();
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Relationships fetch failed', details: error.message });
  }
});

app.post('/api/relationships', async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Relationship creation failed', details: error.message });
  }
});

app.get('/api/tasks/:id/relationships', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blueClient.getTaskRelationships(id);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Task relationships fetch failed', details: error.message });
  }
});

app.delete('/api/relationships/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await blueClient.deleteRelationship(id);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Relationship deletion failed', details: error.message });
  }
});

// Custom GraphQL query endpoint
app.post('/api/graphql', async (req, res) => {
  try {
    const { query, variables } = req.body;
    const result = await blueClient.executeQuery(query, variables);
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'GraphQL query failed', details: error.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(500).json({ error: 'Something broke!', details: err.message });
});

app.listen(PORT, async () => {
  console.log(`PMT Backend running on http://localhost:${PORT}`);
  console.log('BlueClient instance:', blueClient ? 'Loaded' : 'Not Loaded');
  // Initial connection test
  if (blueClient) {
      await blueClient.testConnection();
  }
});
