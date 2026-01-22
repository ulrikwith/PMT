import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'tasks.json');

const BLUE_API_ENDPOINT = 'https://api.blue.cc/graphql';

const DIMENSION_TAGS = {
  // Content
  SUBSTACK: { name: 'substack', color: '#FF6719' },     // Orange
  NEWSLETTER: { name: 'newsletter', color: '#3B82F6' }, // Blue
  BOOKS: { name: 'books', color: '#6366F1' },           // Indigo
  
  // Practice (Green theme)
  PRACTICE: { name: 'practice', color: '#10B981' },     // Main
  STONE: { name: 'stone', color: '#10B981' },
  WALK: { name: 'walk', color: '#34D399' },
  B2B: { name: 'b2b', color: '#6EE7B7' },

  // Community (Pink theme)
  COMMUNITY: { name: 'community', color: '#EC4899' },   // Main
  MISSION: { name: 'mission', color: '#EC4899' },
  DEVELOPMENT: { name: 'development', color: '#F472B6' },
  FIRST30: { name: 'first30', color: '#FBCFE8' },

  // Marketing (Amber theme)
  MARKETING: { name: 'marketing', color: '#F59E0B' },   // Main
  BOPA: { name: 'bopa', color: '#F59E0B' },
  WEBSITE: { name: 'website', color: '#FBBF24' },
  MARKETING_OTHER: { name: 'marketing-other', color: '#FDE68A' },

  // Admin (Purple theme)
  ADMIN: { name: 'admin', color: '#8B5CF6' },          // Main
  PLANNING: { name: 'planning', color: '#8B5CF6' },
  ACCOUNTING: { name: 'accounting', color: '#A78BFA' },
  ADMIN_OTHER: { name: 'admin-other', color: '#C4B5FD' }
};

class BlueClient {
  constructor() {
    this.client = new GraphQLClient(BLUE_API_ENDPOINT, {
      headers: {
        'X-Bloo-Token-ID': process.env.BLUE_TOKEN_ID,
        'X-Bloo-Token-Secret': process.env.BLUE_SECRET_ID,
        'Content-Type': 'application/json',
      },
    });
    this.companyId = null;
    this.companyUid = null;
    this.defaultProjectId = null;
    this.defaultProjectUid = null;
    this.defaultTodoListId = null;
    this.localTasks = [];
    this.localTags = [];
    this.localRelationships = []; // Store relationships locally
    this.localMilestoneLinks = []; // Store task-milestone links locally
    this.useLocalMode = false; // Track whether we're in local-only mode
    this.initLocalStore();
  }

  async initLocalStore() {
    try {
      const data = await fs.readFile(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      this.localTasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
      this.localTags = parsed.tags || [];
      this.localRelationships = parsed.relationships || [];
      this.localMilestoneLinks = parsed.milestoneLinks || [];
      console.log(`Loaded ${this.localTasks.length} tasks, ${this.localTags.length} tags, ${this.localRelationships.length} rels, and ${this.localMilestoneLinks.length} milestone links`);
    } catch (error) {
      console.warn('Could not load local tasks, starting empty:', error.message);
      this.localTasks = [];
      this.localTags = [];
      this.localRelationships = [];
      this.localMilestoneLinks = [];
    }
  }

  async saveLocalStore() {
    try {
      const data = {
        tasks: this.localTasks,
        tags: this.localTags,
        relationships: this.localRelationships,
        milestoneLinks: this.localMilestoneLinks
      };
      await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
      console.log(`Saved to local storage`);
    } catch (error) {
      console.error('Failed to save local tasks:', error);
    }
  }

  async query(query, variables = {}, options = {}) {
    try {
      // Update client headers - Blue.cc requires both Company ID and Project ID (Internal IDs, not UIDs)
      if (this.companyId && !options.skipCompanyHeader) {
        this.client.setHeader('X-Bloo-Company-ID', this.companyId);
      }

      if (this.defaultProjectId && !options.skipProjectHeader) {
        this.client.setHeader('X-Bloo-Project-ID', this.defaultProjectId);
      }

      const data = await this.client.request(query, variables);
      return { success: true, data };
    } catch (error) {
      console.error('Blue.cc API Error:', error.message);
      if (error.response) {
        console.error('Response Errors:', JSON.stringify(error.response.errors, null, 2));
      }
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    console.log('Testing Blue.cc API connection...');
    console.log('Token ID:', process.env.BLUE_TOKEN_ID ? 'Present' : 'Missing');
    console.log('Secret ID:', process.env.BLUE_SECRET_ID ? 'Present' : 'Missing');
    
    const query = `
      query TestConnection {
        __schema {
          queryType {
            name
          }
        }
      }
    `;
    
    const result = await this.query(query);
    if (result.success) {
      console.log('✓ Blue.cc API connection successful!');
      this.useLocalMode = false;
      await this.ensureWorkspace();
      await this.ensureDimensionTags();
      return true;
    } else {
      console.log('✗ Blue.cc API connection failed. Falling back to local mode.');
      this.useLocalMode = true;
      return false;
    }
  }

  // --- Workspace Management ---

  async ensureWorkspace() {
    if (this.useLocalMode) return null;
    try {
      // Get company and project - this sets the headers
      const companyId = await this.getCompanyId();
      const projectId = await this.getDefaultProjectId(companyId);

      // Now try to get todoList with both headers set
      const todoListId = await this.getDefaultTodoListId(projectId);

      console.log('✅ Blue.cc workspace configured successfully!');
      return { companyId, projectId, todoListId };
    } catch (error) {
      console.error('Workspace setup failed:', error);
      this.useLocalMode = true;
      return null;
    }
  }

  async getCompanyId() {
    if (this.useLocalMode) return 'local-company';
    if (this.companyId) return this.companyId;

    // Use recentProjects query to get company - simpler and more reliable
    const query = `
      query GetRecentProjects {
        recentProjects {
          id
          uid
          company {
            id
            uid
            name
          }
        }
      }
    `;

    const result = await this.query(query, {}, { skipCompanyHeader: true });
    if (result.success && result.data.recentProjects && result.data.recentProjects.length > 0) {
      this.companyId = result.data.recentProjects[0].company.id;
      this.companyUid = result.data.recentProjects[0].company.uid;
      console.log(`✓ Found company: ${result.data.recentProjects[0].company.name} (ID: ${this.companyId}, UID: ${this.companyUid})`);
      return this.companyId;
    }

    console.log('No company found or API error.');
    throw new Error('No company found');
  }

  async getDefaultProjectId(companyId) {
    if (this.useLocalMode) return 'local-project';
    if (this.defaultProjectId) return this.defaultProjectId;
    
    // Check Env
    if (process.env.BLUE_PROJECT_ID) {
        this.defaultProjectId = process.env.BLUE_PROJECT_ID;
        console.log(`✓ Using configured project ID: ${this.defaultProjectId}`);
        return this.defaultProjectId;
    }

    // Use recentProjects query to get first project with UID
    const projectQuery = `
      query GetRecentProjects {
        recentProjects {
          id
          uid
          name
        }
      }
    `;
    const result = await this.query(projectQuery, {}, { skipCompanyHeader: true });
    if (!result.success) throw new Error('Failed to fetch projects');

    const projects = result.data.recentProjects || [];
    if (projects.length > 0) {
      this.defaultProjectId = projects[0].id;
      this.defaultProjectUid = projects[0].uid;
      console.log(`✓ Using project: ${projects[0].name} (ID: ${this.defaultProjectId}, UID: ${this.defaultProjectUid})`);
      return this.defaultProjectId;
    }

    // Create default project
    const createProjectMutation = `
      mutation CreateProject($input: CreateProjectInput!) {
        createProject(input: $input) {
          id
          name
        }
      }
    `;
    const projectInput = {
      companyId,
      name: 'Inner Allies',
    };
    const createResult = await this.query(createProjectMutation, { input: projectInput });
    if (createResult.success) {
      return createResult.data.createProject.id;
    }
    throw new Error('Failed to create project');
  }

  async getDefaultTodoListId(projectId) {
    if (this.useLocalMode) return 'local-todolist';
    if (this.defaultTodoListId) return this.defaultTodoListId;

    // Check Env
    if (process.env.BLUE_TODO_LIST_ID) {
        this.defaultTodoListId = process.env.BLUE_TODO_LIST_ID;
        console.log(`✓ Using configured TodoList ID: ${this.defaultTodoListId}`);
        return this.defaultTodoListId;
    }

    // Use projectId if provided, otherwise fetch it
    if (!projectId) {
       const companyId = await this.getCompanyId();
       projectId = await this.getDefaultProjectId(companyId);
    }

    const todoListQuery = `
      query GetProjectTodoLists($projectId: String!) {
        project(id: $projectId) {
          todoLists {
            id
            title
          }
        }
      }
    `;
    
    const result = await this.query(todoListQuery, { projectId });
    if (!result.success) throw new Error('Failed to fetch todo lists');

    const todoLists = result.data.project.todoLists || [];
    if (todoLists.length > 0) {
      this.defaultTodoListId = todoLists[0].id;
      console.log(`✓ Found TodoList: ${todoLists[0].title} (ID: ${this.defaultTodoListId})`);
      return this.defaultTodoListId;
    }

    // No TodoLists found - create a new one
    console.log('⚠️  No TodoLists found in project. Creating default "Tasks" list...');

    // Create default list
    const createListMutation = `
      mutation CreateTodoList($input: CreateTodoListInput!) {
        createTodoList(input: $input) {
          id
          title
        }
      }
    `;
    const listInput = {
      projectId,
      title: 'Tasks',
      position: 1
    };
    const createResult = await this.query(createListMutation, { input: listInput });
    if (createResult.success) {
      this.defaultTodoListId = createResult.data.createTodoList.id;
      return this.defaultTodoListId;
    }
    throw new Error('Failed to create todo list');
  }

  async getWorkspaces() {
     if (this.useLocalMode) {
      return { 
        success: true, 
        data: [{ 
          id: 'local-workspace', 
          name: 'My Workspace (Local)', 
          description: 'Running in local mode - Blue.cc API unavailable' 
        }] 
      };
    }
    try {
        const id = await this.getCompanyId();
        return { success: true, data: [{ id, name: 'Blue.cc Workspace' }] };
    } catch (e) {
        return { success: false, error: e.message };
    }
  }

  // --- Task Management ---

  async getTasks(filters = {}) {
    if (this.useLocalMode) {
      // Basic local filtering
      let tasks = [...this.localTasks];
      
      if (filters.search) {
        const lowerSearch = filters.search.toLowerCase();
        tasks = tasks.filter(t =>
          (t.title || '').toLowerCase().includes(lowerSearch) ||
          (t.description || '').toLowerCase().includes(lowerSearch)
        );
      }

      if (filters.status) {
        tasks = tasks.filter(t => t.status === filters.status);
      }

      if (filters.dimension) {
        const dim = filters.dimension.toLowerCase();
        tasks = tasks.filter(t => t.tags && t.tags.some(tag => tag.toLowerCase().includes(dim)));
      }

      return { success: true, data: tasks };
    }

    try {
      const todoListId = await this.getDefaultTodoListId();
      
      const query = `
        query GetTodos($todoListId: String!) {
          todoList(id: $todoListId) {
            todos {
              id
              title
              text
              done
              position
              tags {
                id
                title
                color
              }
              createdAt
              updatedAt
              duedAt
              startedAt
            }
          }
        }
      `;
      
      const result = await this.query(query, { todoListId });
      
      if (result.success) {
        // Temporary storage to rebuild relationships/milestones from cloud source-of-truth
        const cloudRelationships = [];
        const cloudMilestoneLinks = [];

        // Get all todo IDs for comment fetching
        const todoIds = result.data.todoList.todos.map(todo => todo.id);

        // Fetch comments for all todos in parallel
        const commentPromises = todoIds.map(todoId =>
          this.getCommentsForTodo(todoId).catch(err => {
            console.warn(`Failed to fetch comments for ${todoId}:`, err);
            return { success: false, data: [] };
          })
        );

        const commentResults = await Promise.all(commentPromises);

        // Parse relationship and milestone data from comments
        commentResults.forEach((commentsResult, index) => {
          if (commentsResult.success && commentsResult.data) {
            const todoId = todoIds[index];
            commentsResult.data.forEach(comment => {
              if (comment.html) {
                // Check for relationship comment
                const relMatch = comment.html.match(/data-pmt-relationship="([^"]+)"/);
                if (relMatch) {
                  try {
                    // Extract Base64 data from HTML
                    const base64Match = comment.html.match(/>([A-Za-z0-9+/=]+)</);
                    if (base64Match) {
                      const base64Data = base64Match[1];
                      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
                      const relData = JSON.parse(jsonString);
                      cloudRelationships.push({
                        id: relData.id,
                        fromTaskId: relData.fromTaskId,
                        toTaskId: relData.toTaskId,
                        type: relData.type,
                        label: relData.label,
                        createdAt: relData.createdAt,
                        commentId: comment.id // Store for deletion
                      });
                    }
                  } catch (e) {
                    console.error(`Failed to parse relationship comment ${comment.id}:`, e);
                  }
                }

                // Check for milestone comment
                const milestoneMatch = comment.html.match(/data-pmt-milestone="([^"]+)"/);
                if (milestoneMatch) {
                  try {
                    // Extract Base64 data from HTML
                    const base64Match = comment.html.match(/>([A-Za-z0-9+/=]+)</);
                    if (base64Match) {
                      const base64Data = base64Match[1];
                      const jsonString = Buffer.from(base64Data, 'base64').toString('utf-8');
                      const linkData = JSON.parse(jsonString);
                      cloudMilestoneLinks.push({
                        taskId: linkData.taskId,
                        milestoneId: linkData.milestoneId,
                        createdAt: linkData.createdAt,
                        commentId: comment.id // Store for deletion
                      });
                    }
                  } catch (e) {
                    console.error(`Failed to parse milestone comment ${comment.id}:`, e);
                  }
                }
              }
            });
          }
        });

        // Parse all tasks
        const tasks = result.data.todoList.todos.map(todo => {
          // Parse rich metadata from text field
          let description = todo.text || '';
          let workData = {};

          try {
            // Check for Base64 encoded metadata
            const text = todo.text || '';
            const metaMarker = '---PMT-META---';
            
            if (text.includes(metaMarker)) {
                const parts = text.split(metaMarker);
                description = parts[0].trim();
                // Sanitize Base64
                const base64Meta = parts[1].replace(/\s/g, '');
                if (base64Meta) {
                    const jsonMeta = Buffer.from(base64Meta, 'base64').toString('utf-8');
                    const parsed = JSON.parse(jsonMeta);
                    if (parsed) {
                        // Compact format
                        workData = {
                            workType: parsed.wt,
                            targetOutcome: parsed.to,
                            activities: parsed.a || [],
                            resources: parsed.r || {},
                            position: parsed.p
                        };
                    }
                }
            } else {
                // Plain text description
                description = text;
            }
          } catch (e) {
            console.error('Failed to parse task metadata', e);
            description = todo.text || '';
          }

          // Note: Relationships and milestones are stored as comments
          // They are populated from cloudRelationships/cloudMilestoneLinks below

          return {
            id: todo.id,
            title: todo.title,
            description,
            status: todo.done ? 'Done' : 'In Progress',
            dueDate: todo.duedAt,
            startDate: todo.startedAt,
            tags: todo.tags ? todo.tags.map(t => t.title) : [],
            position: todo.position,
            createdAt: todo.createdAt,
            updatedAt: todo.updatedAt,
            // Include rich metadata
            workType: workData.workType,
            targetOutcome: workData.targetOutcome,
            activities: workData.activities || [],
            resources: workData.resources || {},
            ...(workData.position && { position: workData.position }),
            // Internal use only (preserved in metadata but not exposed as top-level task props usually)
            // But good to have if needed
            _relationships: workData.relationships || [],
            _milestones: workData.milestones || []
          };
        });
        
        // Populate _relationships and _milestones on each task based on metadata
        tasks.forEach(task => {
          task._relationships = cloudRelationships
            .filter(r => r.fromTaskId === task.id)
            .map(r => ({
              id: r.id,
              toTaskId: r.toTaskId,
              type: r.type,
              label: r.label
            }));

          task._milestones = cloudMilestoneLinks
            .filter(l => l.taskId === task.id)
            .map(l => l.milestoneId);
        });

        // --- Eventual Consistency Safety Net ---
        // Blue.cc API might lag behind recent creations.
        // Check for tasks in local cache that are missing from cloud but were created recently.
        const SYNC_GRACE_PERIOD_MS = 2 * 60 * 1000; // 2 minutes
        const now = Date.now();

        const cloudTaskIds = new Set(tasks.map(t => t.id));
        
        this.localTasks.forEach(localTask => {
            if (!cloudTaskIds.has(localTask.id)) {
                // Task is missing from cloud response. Check age.
                const createdTime = new Date(localTask.createdAt).getTime();
                if (now - createdTime < SYNC_GRACE_PERIOD_MS) {
                    console.log(`🛡️ Preserving recently created task "${localTask.title}" (${localTask.id}) not yet seen in cloud.`);
                    tasks.push(localTask);
                } else {
                    console.log(`🗑️ Pruning stale local task "${localTask.title}" (${localTask.id}) not found in cloud.`);
                }
            }
        });
        // ---------------------------------------

        // Sync to local storage as cache
        this.localTasks = tasks;
        this.localRelationships = cloudRelationships; // Overwrite local with Cloud Truth
        this.localMilestoneLinks = cloudMilestoneLinks; // Overwrite local with Cloud Truth

        await this.saveLocalStore();

        console.log(`✓ Loaded ${tasks.length} tasks, ${cloudRelationships.length} relationships, ${cloudMilestoneLinks.length} milestone links from cloud`);

        return { success: true, data: tasks };
      }
      
      this.useLocalMode = true;
      return { success: true, data: this.localTasks };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      this.useLocalMode = true;
      return { success: true, data: this.localTasks };
    }
  }

  async createTask(taskData) {
    if (this.useLocalMode) {
      // ... local creation ...
      const newLocalTask = {
        id: `local-${Date.now()}`,
        title: taskData.title,
        description: taskData.description || '',
        status: 'In Progress',
        tags: taskData.tags || [],
        dueDate: taskData.dueDate || null,
        
        workType: taskData.workType || 'part-of-element',
        targetOutcome: taskData.targetOutcome || '',
        startDate: taskData.startDate || null,
        activities: taskData.activities || [],
        resources: taskData.resources || {},
        position: taskData.position || { x: 0, y: 0 },
        // New fields
        relationships: [],
        milestones: [],
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.localTasks.push(newLocalTask);
      await this.saveLocalStore();
      return { success: true, data: newLocalTask };
    }

    try {
      const todoListId = await this.getDefaultTodoListId();
      
      const meta = {
          workType: taskData.workType,
          targetOutcome: taskData.targetOutcome,
          activities: taskData.activities,
          resources: taskData.resources,
          position: taskData.position,
          // Initialize empty arrays
          relationships: [],
          milestones: []
      };
      
      const base64Meta = Buffer.from(JSON.stringify(meta)).toString('base64');
      const finalDescription = `${taskData.description || ''}\n\n---PMT-META---\n${base64Meta}`;

      const mutation = `
        mutation CreateTodo($input: CreateTodoInput!) {
          createTodo(input: $input) {
            id
            title
            text
            done
            duedAt
            startedAt
            tags {
               id
               title
            }
            createdAt
            updatedAt
          }
        }
      `;
      
      const input = {
        todoListId,
        title: taskData.title,
        description: finalDescription, 
        duedAt: taskData.dueDate ? (taskData.dueDate.includes('T') ? taskData.dueDate : `${taskData.dueDate}T09:00:00.000Z`) : null,
        startedAt: taskData.startDate ? (taskData.startDate.includes('T') ? taskData.startDate : `${taskData.startDate}T09:00:00.000Z`) : null
      };

      const result = await this.query(mutation, { input });
      
      if (result.success) {
        const todo = result.data.createTodo;
        const task = {
            id: todo.id,
            title: todo.title,
            description: taskData.description,
            status: 'In Progress',
            dueDate: todo.duedAt,
            startDate: todo.startedAt,
            tags: [], 
            
            workType: taskData.workType,
            targetOutcome: taskData.targetOutcome,
            activities: taskData.activities,
            resources: taskData.resources,
            position: taskData.position,
            
            _relationships: [],
            _milestones: [],

            createdAt: todo.createdAt,
            updatedAt: todo.updatedAt
        };

        if (taskData.tags && taskData.tags.length > 0) {
            for (const tagName of taskData.tags) {
                await this.addTagToTask(task.id, tagName);
            }
            task.tags = taskData.tags;
        }

        // Add to local cache for immediate availability
        this.localTasks.push(task);
        await this.saveLocalStore();

        return { success: true, data: task };
      }
      
      this.useLocalMode = true;
      return this.createTask(taskData);
      
    } catch (error) {
      console.error('Error creating task:', error);
      this.useLocalMode = true;
      return this.createTask(taskData);
    }
  }

  async updateTask(taskId, updates) {
     if (this.useLocalMode || taskId.startsWith('local-')) {
       // ... local update ...
      const index = this.localTasks.findIndex(t => t.id === taskId);
      if (index !== -1) {
        const updated = { ...this.localTasks[index], ...updates, updatedAt: new Date().toISOString() };
        this.localTasks[index] = updated;
        await this.saveLocalStore();
        return { success: true, data: updated };
      }
      return { success: false, error: 'Task not found' };
    }

    // Cloud update
    const mutation = `
      mutation EditTodo($input: EditTodoInput!) {
        editTodo(input: $input) {
          id
          title
          text
          done
          duedAt
          startedAt
          tags { title }
          updatedAt
        }
      }
    `;

    const input = { todoId: taskId };
    if (updates.title) input.title = updates.title;
    if (updates.dueDate) input.duedAt = updates.dueDate.includes('T') ? updates.dueDate : `${updates.dueDate}T09:00:00.000Z`;
    if (updates.startDate) input.startedAt = updates.startDate.includes('T') ? updates.startDate : `${updates.startDate}T09:00:00.000Z`;

    // Handle Status Change via separate mutation if needed
    if (updates.status) {
        try {
             const statusQuery = `query GetStatus($id: String!) { todo(id: $id) { done } }`;
             const statusRes = await this.query(statusQuery, { id: taskId });
             if (statusRes.success) {
                 const currentDone = statusRes.data.todo.done;
                 const targetDone = updates.status === 'Done';
                 
                 if (currentDone !== targetDone) {
                     const toggleMutation = `mutation Toggle($id: String!) { updateTodoDoneStatus(todoId: $id) { id done } }`;
                     await this.query(toggleMutation, { id: taskId });
                 }
             }
        } catch (e) {
            console.error("Failed to update status", e);
        }
    }

    // Note: relationships and milestones are local-only (not synced to Blue.cc due to field size limits)
    const hasRichUpdates = updates.description !== undefined || updates.workType !== undefined ||
                           updates.targetOutcome !== undefined || updates.activities !== undefined ||
                           updates.resources !== undefined || updates.position !== undefined;

    if (hasRichUpdates) {
      try {
        let currentWorkData = {};
        let currentDescription = '';
        
        // Prefer local cache to avoid eventual consistency issues with rapid updates
        const localTask = this.localTasks.find(t => t.id === taskId);
        
        if (localTask) {
            currentDescription = localTask.description || '';
            currentWorkData = {
                workType: localTask.workType,
                targetOutcome: localTask.targetOutcome,
                activities: localTask.activities,
                resources: localTask.resources,
                position: localTask.position,
                relationships: localTask._relationships || [],
                milestones: localTask._milestones || []
            };
        } else {
            // Fallback: Fetch current task from cloud
            const currentTaskQuery = `
              query GetTodo($id: String!) {
                todo(id: $id) {
                  text
                }
              }
            `;
            const currentResult = await this.query(currentTaskQuery, { id: taskId });
    
            if (currentResult.success && currentResult.data.todo.text) {
               const text = currentResult.data.todo.text;
               const metaMarker = '---PMT-META---';
               if (text.includes(metaMarker)) {
                   const parts = text.split(metaMarker);
                   currentDescription = parts[0].trim();
                   // Sanitize Base64
                   const base64Meta = parts[1].replace(/\s/g, '');
                    if (base64Meta) {
                        try {
                            const jsonMeta = Buffer.from(base64Meta, 'base64').toString('utf-8');
                            const parsed = JSON.parse(jsonMeta);
                            // Expand compact format
                            currentWorkData = {
                                workType: parsed.wt,
                                targetOutcome: parsed.to,
                                activities: parsed.a || [],
                                resources: parsed.r || {},
                                position: parsed.p
                            };
                        } catch(e) {}
                    }
               } else {
                   currentDescription = text;
               }
            }
        }

        // Merge updates with existing data
        const mergedWorkData = {
          workType: updates.workType !== undefined ? updates.workType : currentWorkData.workType,
          targetOutcome: updates.targetOutcome !== undefined ? updates.targetOutcome : currentWorkData.targetOutcome,
          activities: updates.activities !== undefined ? updates.activities : currentWorkData.activities,
          resources: updates.resources !== undefined ? updates.resources : currentWorkData.resources,
          position: updates.position !== undefined ? updates.position : currentWorkData.position
        };

        const mergedDescription = updates.description !== undefined ? updates.description : currentDescription;

        // Serialize back to text with Base64 (compact format)
        const compactWorkData = {
          wt: mergedWorkData.workType,
          to: mergedWorkData.targetOutcome,
          a: mergedWorkData.activities || [],
          r: mergedWorkData.resources || {},
          p: mergedWorkData.position
        };

        const base64Meta = Buffer.from(JSON.stringify(compactWorkData)).toString('base64');
        input.text = `${mergedDescription}\n\n---PMT-META---\n${base64Meta}`;

      } catch (error) {
        console.error('Error merging rich metadata:', error);
        if (updates.description) input.text = updates.description;
      }
    }

    // Only run edit mutation if there are other updates
    if (Object.keys(input).length > 1) {
        const result = await this.query(mutation, { input });
        if (result.success) {
            const todo = result.data.editTodo;

            // Re-construct the return data using what we sent (safest)
            // plus what we got back for system fields

            let returnWorkData = {};
            // Prefer input.text (what we wrote) over todo.text (eventual consistency issue)
            const textContent = input.text || todo.text || '';

            if (textContent && textContent.includes('---PMT-META---')) {
                 try {
                     const b64 = textContent.split('---PMT-META---')[1].trim();
                     const parsed = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
                     // Expand compact format
                     returnWorkData = {
                         workType: parsed.wt,
                         targetOutcome: parsed.to,
                         activities: parsed.a || [],
                         resources: parsed.r || {},
                         position: parsed.p
                     };
                 } catch(e) {
                     console.error('Failed to parse returnWorkData:', e);
                 }
            }

            const updatedTask = {
                    id: todo.id,
                    title: todo.title,
                    description: updates.description !== undefined ? updates.description : (textContent.includes('---PMT-META---') ? textContent.split('---PMT-META---')[0].trim() : textContent),
                    status: todo.done ? 'Done' : 'In Progress',
                    dueDate: todo.duedAt,
                    startDate: todo.startedAt,
                    tags: todo.tags ? todo.tags.map(t => t.title) : [],
                    updatedAt: todo.updatedAt,

                    workType: returnWorkData.workType,
                    targetOutcome: returnWorkData.targetOutcome,
                    activities: returnWorkData.activities || [],
                    resources: returnWorkData.resources || {},
                    position: returnWorkData.position,

                    // Relationships and milestones come from comments (not stored in task metadata)
                    _relationships: [],
                    _milestones: [],

                    ...updates
            };

            // Update local cache
            const cacheIndex = this.localTasks.findIndex(t => t.id === taskId);
            if (cacheIndex !== -1) {
                // Preserve local-only relationships and milestones
                updatedTask._relationships = this.localTasks[cacheIndex]._relationships || [];
                updatedTask._milestones = this.localTasks[cacheIndex]._milestones || [];
                this.localTasks[cacheIndex] = updatedTask;
            }

            await this.saveLocalStore();

            return {
                success: true,
                data: updatedTask
            };
        }
        return result;
    } else {
        // Just status update
        return { success: true, data: { id: taskId, ...updates } };
    }
  }

  async deleteTask(taskId) {
    if (this.useLocalMode || taskId.startsWith('local-')) {
      this.localTasks = this.localTasks.filter(t => t.id !== taskId);
      await this.saveLocalStore();
      return { success: true, data: { id: taskId } };
    }

    const mutation = `
      mutation DeleteTodo($input: DeleteTodoInput!) {
        deleteTodo(input: $input) {
          success
        }
      }
    `;
    const result = await this.query(mutation, { input: { todoId: taskId } });
    
    if (result.success) {
      // Update local cache immediately to prevent Safety Net from restoring it
      this.localTasks = this.localTasks.filter(t => t.id !== taskId);
      await this.saveLocalStore();
      console.log(`✓ Deleted task ${taskId} from cloud and local cache`);
    }

    return result;
  }

  // --- Tag Management ---

  async ensureDimensionTags() {
      if (this.useLocalMode) {
          // Ensure local tags exist
          Object.values(DIMENSION_TAGS).forEach(tag => {
              if (!this.localTags.find(t => t.name === tag.name)) {
                  this.localTags.push(tag);
              }
          });
          await this.saveLocalStore();
          return;
      }

      // Check cloud tags and create if missing
      // Logic for cloud tag creation would go here
      // For now, assume success or fallback
  }

  async getTags() {
      if (this.useLocalMode) {
          return { success: true, data: this.localTags };
      }
      // Fetch cloud tags
      // For now, returning local tags as placeholder or combined
      // Ideally query cloud tags
      return { success: true, data: Object.values(DIMENSION_TAGS) }; // Simplified
  }

  async createTag(name, color) {
      if (this.useLocalMode) {
          const newTag = { name, color: color || '#888888' };
          this.localTags.push(newTag);
          await this.saveLocalStore();
          return { success: true, data: newTag };
      }

      // Cloud create tag - FULL IMPLEMENTATION
      try {
          const createTagMutation = `
            mutation CreateTag($input: CreateTagInput!) {
              createTag(input: $input) {
                id
                title
                color
              }
            }
          `;

          const result = await this.query(createTagMutation, {
              input: { title: name, color: color || '#888888' }
          });

          if (result.success) {
              console.log(`✓ Created tag "${name}" with color ${color || '#888888'}`);
              return {
                  success: true,
                  data: {
                      id: result.data.createTag.id,
                      name: result.data.createTag.title,
                      color: result.data.createTag.color
                  }
              };
          }

          return result;
      } catch (error) {
          console.error('Error creating tag:', error);
          return { success: false, error: error.message };
      }
  }

  async addTagToTask(taskId, tagName) {
      if (this.useLocalMode || taskId.startsWith('local-')) {
          const task = this.localTasks.find(t => t.id === taskId);
          if (task && !task.tags.includes(tagName)) {
              task.tags.push(tagName);
              await this.saveLocalStore();
          }
          return { success: true };
      }

      // Cloud add tag to task - FULL IMPLEMENTATION
      try {
          // First, get or create the tag
          const tagQuery = `
            query GetTags {
              tags {
                id
                title
                color
              }
            }
          `;

          const tagsResult = await this.query(tagQuery);
          let tagId = null;

          if (tagsResult.success && tagsResult.data.tags) {
              const existingTag = tagsResult.data.tags.find(t => t.title === tagName);
              if (existingTag) {
                  tagId = existingTag.id;
              }
          }

          // If tag doesn't exist, create it with proper color
          if (!tagId) {
              const dimensionTag = Object.values(DIMENSION_TAGS).find(t => t.name === tagName);
              const color = dimensionTag ? dimensionTag.color : '#888888';

              const createTagMutation = `
                mutation CreateTag($input: CreateTagInput!) {
                  createTag(input: $input) {
                    id
                    title
                    color
                  }
                }
              `;

              const createTagResult = await this.query(createTagMutation, {
                  input: { title: tagName, color }
              });

              if (createTagResult.success) {
                  tagId = createTagResult.data.createTag.id;
                  console.log(`✓ Created tag "${tagName}" with color ${color}`);
              } else {
                  console.error('Failed to create tag:', tagName);
                  return { success: false, error: 'Failed to create tag' };
              }
          }

          // Now associate tag with task
          const addTagMutation = `
            mutation AddTagToTodo($input: AddTagToTodoInput!) {
              addTagToTodo(input: $input) {
                id
                tags {
                  id
                  title
                  color
                }
              }
            }
          `;

          const result = await this.query(addTagMutation, {
              input: { todoId: taskId, tagId }
          });

          if (result.success) {
              console.log(`✓ Added tag "${tagName}" to task ${taskId}`);
          }

          return result;
      } catch (error) {
          console.error('Error adding tag to task:', error);
          return { success: false, error: error.message };
      }
  }

  // --- Comments API ---

  async createComment(todoId, text, html = null) {
    if (this.useLocalMode || todoId.startsWith('local-')) {
      // Local mode doesn't support comments - fallback to metadata approach
      console.warn('Comments not supported in local mode');
      return { success: false, error: 'Comments not supported in local mode' };
    }

    try {
      const mutation = `
        mutation CreateComment($input: CreateCommentInput!) {
          createComment(input: $input) {
            id
            text
            html
            createdAt
          }
        }
      `;

      const input = {
        category: 'TODO',
        categoryId: todoId,
        text,
        ...(html && { html })
      };

      const result = await this.query(mutation, { input });

      if (result.success) {
        console.log(`✓ Created comment for todo ${todoId}`);
        return { success: true, data: result.data.createComment };
      }

      return result;
    } catch (error) {
      console.error('Error creating comment:', error);
      return { success: false, error: error.message };
    }
  }

  async getCommentsForTodo(todoId) {
    if (this.useLocalMode || todoId.startsWith('local-')) {
      return { success: true, data: [] };
    }

    try {
      const query = `
        query GetComments($categoryId: String!, $category: CommentCategory!) {
          commentList(categoryId: $categoryId, category: $category) {
            id
            text
            html
            createdAt
            files
          }
        }
      `;

      const result = await this.query(query, {
        categoryId: todoId,
        category: 'TODO'
      });

      if (result.success) {
        return { success: true, data: result.data.commentList || [] };
      }

      return result;
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteComment(commentId) {
    if (this.useLocalMode) {
      return { success: false, error: 'Comments not supported in local mode' };
    }

    try {
      const mutation = `
        mutation DeleteComment($id: String!) {
          deleteComment(id: $id)
        }
      `;

      const result = await this.query(mutation, { id: commentId });

      if (result.success) {
        console.log(`✓ Deleted comment ${commentId}`);
      }

      return result;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: error.message };
    }
  }

  // --- Relationship Management (Comments-based) ---

  async createTaskRelationship(fromTaskId, toTaskId, type, label = null) {
    // Check for duplicate
    const exists = this.localRelationships.find(
      r => r.fromTaskId === fromTaskId && r.toTaskId === toTaskId && r.type === type
    );

    if (exists) {
        console.log(`✓ Relationship already exists: ${fromTaskId} --[${type}]--> ${toTaskId}`);
        return { success: true, data: exists };
    }

    const relId = `rel-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newRel = {
      id: relId,
      fromTaskId,
      toTaskId,
      type,
      label,
      createdAt: new Date().toISOString()
    };

    // Store in local cache
    this.localRelationships.push(newRel);
    await this.saveLocalStore();

    // If not in local mode, create a comment in Blue.cc
    if (!this.useLocalMode && !fromTaskId.startsWith('local-')) {
      try {
        const metadataJson = JSON.stringify({
          id: relId,
          fromTaskId,
          toTaskId,
          type,
          label,
          createdAt: newRel.createdAt
        });

        // Use Base64 encoding in HTML field to store structured data
        const base64Metadata = Buffer.from(metadataJson).toString('base64');

        // Human-readable text + machine-readable HTML
        const text = `[PMT Relationship] ${type}${label ? ': ' + label : ''} → ${toTaskId}`;
        const html = `<div data-pmt-relationship="${relId}">${base64Metadata}</div>`;

        const result = await this.createComment(fromTaskId, text, html);

        if (result.success) {
          // Store comment ID for deletion later
          newRel.commentId = result.data.id;
          console.log(`✓ Created relationship comment in cloud: ${relId}`);
        } else {
          console.warn(`⚠️  Failed to create relationship comment in cloud (using local-only): ${result.error}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to create relationship comment in cloud (using local-only): ${error.message}`);
      }
    }

    console.log(`✓ Created relationship: ${fromTaskId} --[${type}]--> ${toTaskId}`);
    return { success: true, data: newRel };
  }

  async getTaskRelationships(taskId) {
    // We rely on getTasks() to have populated localRelationships from Cloud Data
    const relationships = this.localRelationships.filter(
      r => r.fromTaskId === taskId || r.toTaskId === taskId
    );
    return { success: true, data: relationships };
  }
  
  async deleteRelationship(relationshipId) {
      const rel = this.localRelationships.find(r => r.id === relationshipId);

      if (!rel) {
          console.error(`Relationship ${relationshipId} not found`);
          return { success: false, error: 'Relationship not found' };
      }

      // Remove from local cache
      this.localRelationships = this.localRelationships.filter(r => r.id !== relationshipId);
      await this.saveLocalStore();

      // If not in local mode, delete the comment from Blue.cc
      if (!this.useLocalMode && !rel.fromTaskId.startsWith('local-')) {
        try {
          // If we have a stored commentId, use it directly
          if (rel.commentId) {
            await this.deleteComment(rel.commentId);
            console.log(`✓ Deleted relationship comment from cloud: ${relationshipId}`);
          } else {
            // Fallback: find the comment by searching for relationship ID in comments
            const comments = await this.getCommentsForTodo(rel.fromTaskId);
            if (comments.success) {
              const relComment = comments.data.find(c =>
                c.html && c.html.includes(`data-pmt-relationship="${relationshipId}"`)
              );
              if (relComment) {
                await this.deleteComment(relComment.id);
                console.log(`✓ Deleted relationship comment from cloud: ${relationshipId}`);
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️  Failed to delete relationship comment from cloud: ${error.message}`);
        }
      }

      console.log(`✓ Deleted relationship: ${relationshipId}`);
      return { success: true };
  }

  async getAllRelationships() {
      return { success: true, data: this.localRelationships };
  }

  // --- Milestone Management ---

  async linkTaskToMilestone(taskId, milestoneId) {
      const exists = this.localMilestoneLinks.find(l => l.taskId === taskId && l.milestoneId === milestoneId);

      if (exists) {
          console.log(`✓ Milestone link already exists: ${taskId} -> ${milestoneId}`);
          return { success: true, data: exists };
      }

      const link = { taskId, milestoneId, createdAt: new Date().toISOString() };
      this.localMilestoneLinks.push(link);
      await this.saveLocalStore();

      // If not in local mode, create a comment in Blue.cc
      if (!this.useLocalMode && !taskId.startsWith('local-')) {
        try {
          const metadataJson = JSON.stringify({
            taskId,
            milestoneId,
            createdAt: link.createdAt
          });

          // Use Base64 encoding in HTML field to store structured data
          const base64Metadata = Buffer.from(metadataJson).toString('base64');

          // Human-readable text + machine-readable HTML
          const text = `[PMT Milestone] Linked to ${milestoneId}`;
          const html = `<div data-pmt-milestone="${milestoneId}">${base64Metadata}</div>`;

          const result = await this.createComment(taskId, text, html);

          if (result.success) {
            // Store comment ID for deletion later
            link.commentId = result.data.id;
            console.log(`✓ Created milestone link comment in cloud: ${taskId} -> ${milestoneId}`);
          } else {
            console.warn(`⚠️  Failed to create milestone comment in cloud (using local-only): ${result.error}`);
          }
        } catch (error) {
          console.warn(`⚠️  Failed to create milestone comment in cloud (using local-only): ${error.message}`);
        }
      }

      console.log(`✓ Linked task to milestone: ${taskId} -> ${milestoneId}`);
      return { success: true, data: link };
  }

  async getTasksForMilestone(milestoneId) {
      // Use local cache populated from Cloud
      const links = this.localMilestoneLinks.filter(l => l.milestoneId === milestoneId);
      const taskIds = links.map(l => l.taskId);
      
      // Ensure tasks are loaded
      if (this.localTasks.length === 0 && !this.useLocalMode) {
          await this.getTasks();
      }
      
      const tasks = this.localTasks.filter(t => taskIds.includes(t.id));
      return { success: true, data: tasks };
  }
  
  async getMilestoneProgress(milestoneId) {
      const result = await this.getTasksForMilestone(milestoneId);
      if (!result.success) return { success: false, error: result.error };
      
      const tasks = result.data;
      if (tasks.length === 0) return { success: true, data: { progress: 0, total: 0, completed: 0 } };
      
      const completed = tasks.filter(t => t.status === 'Done').length;
      const progress = Math.round((completed / tasks.length) * 100);
      
      return { success: true, data: { progress, total: tasks.length, completed } };
  }

  async calculateReadiness() {
     const tasksResult = await this.getTasks();
     const tasks = tasksResult.success ? tasksResult.data : [];
     const completedTasks = tasks.filter(t => t.status === 'Done');

     const check = (keywords) => {
         return completedTasks.some(t => {
             const lower = t.title.toLowerCase();
             return keywords.some(k => lower.includes(k.toLowerCase()));
         });
     };

     // Define structure and criteria
     const readinessData = {
         content: {
             label: "Content",
             items: [
                 { name: "Substack Setup", completed: check(['substack setup', 'create substack', 'setup substack']) },
                 { name: "Substack Welcome", completed: check(['substack welcome', 'intro post']) },
                 { name: "Newsletter Platform", completed: check(['newsletter platform', 'select mailer', 'mailing list']) },
                 { name: "Book Outline", completed: check(['book outline', 'chapter list']) },
                 { name: "Book Draft", completed: check(['first draft', 'manuscript']) }
             ]
         },
         practices: {
             label: "Practices",
             items: [
                 { name: "Stone Concept", completed: check(['stone practice', 'stone concept', 'define stone']) },
                 { name: "Walk Guide", completed: check(['walking practice', 'walk guide', 'audio guide']) },
                 { name: "B2B Pitch", completed: check(['b2b pitch', 'pitch deck', 'corporate offer']) }
             ]
         },
         community: {
             label: "Community",
             items: [
                 { name: "Mission Statement", completed: check(['mission statement', 'define mission', 'values']) },
                 { name: "Community Guidelines", completed: check(['guidelines', 'rules', 'code of conduct']) },
                 { name: "First 30 Plan", completed: check(['first 30', 'onboarding', 'initial cohort']) }
             ]
         },
         marketing: {
             label: "Marketing",
             items: [
                 { name: "BOPA Strategy", completed: check(['bopa', 'borrowed audience']) },
                 { name: "Website Domain", completed: check(['domain', 'buy url', 'dns']) },
                 { name: "Website Launch", completed: check(['launch website', 'publish site', 'mvp']) },
                 { name: "Social Profiles", completed: check(['social media', 'instagram', 'linkedin', 'twitter']) }
             ]
         }
     };

     return { success: true, data: readinessData };
  }
  
  async executeQuery(query, variables = {}) {
    return this.query(query, variables);
  }
}

export default new BlueClient();