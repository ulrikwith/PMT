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
      return this.defaultTodoListId;
    }

    // Fallback for InnerAllies project if list lookup fails (API bug workaround)
    if (projectId === 'cmklpzm7k152gp71ee0lm6bwa') {
        const fallbackId = 'cmklqbb0z13yjnd1e4pjokze9';
        console.log('Using fallback TodoList ID:', fallbackId);
        this.defaultTodoListId = fallbackId;
        return fallbackId;
    }

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
        const tasks = result.data.todoList.todos.map(todo => {
          // Parse rich metadata from text field
          let description = todo.text || '';
          let workData = {};

          try {
            // Check for Base64 encoded metadata
            // Format: [DESCRIPTION] \n\n ---PMT-META---\n [BASE64]
            const text = todo.text || '';
            const metaMarker = '---PMT-META---';
            
            if (text.includes(metaMarker)) {
                const parts = text.split(metaMarker);
                description = parts[0].trim();
                // Sanitize Base64: remove all whitespace/newlines that Blue.cc might have added
                const base64Meta = parts[1].replace(/\s/g, '');
                if (base64Meta) {
                    const jsonMeta = Buffer.from(base64Meta, 'base64').toString('utf-8');
                    const parsed = JSON.parse(jsonMeta);
                    if (parsed) workData = parsed;
                }
            } else {
                // Legacy or plain text
                description = text;
                // Try legacy JSON parse just in case
                try {
                     const parsed = JSON.parse(text);
                     if (parsed.workData) {
                         description = parsed.desc || '';
                         workData = parsed.workData;
                     }
                } catch (ignore) {}
            }
          } catch (e) {
            console.error('Failed to parse task metadata', e);
            description = todo.text || '';
          }

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
            ...(workData.position && { position: workData.position })
          };
        });
        
        // Sync to local storage as cache
        this.localTasks = tasks;
        await this.saveLocalStore();
        
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
          position: taskData.position
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
        // Ensure ISO DateTime format
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

            createdAt: todo.createdAt,
            updatedAt: todo.updatedAt
        };

        if (taskData.tags && taskData.tags.length > 0) {
            for (const tagName of taskData.tags) {
                await this.addTagToTask(task.id, tagName);
            }
            task.tags = taskData.tags;
        }

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
        // Fetch current status to see if toggle is needed
        // For now, assuming updateTodoDoneStatus toggles. 
        // We'll optimistically try to toggle if status != current.
        // But we need current state.
        
        // Let's rely on the user passing correct status intent.
        // Since we don't know if 'updateTodoDoneStatus' sets to TRUE or TOGGLES, 
        // and we can't easily check without a query, we will SKIP status update 
        // in this mutation block and do it separately if possible.
        // However, EditTodoInput DOES NOT support done.
        
        try {
             // We need to know current status to know if we need to toggle
             // We fetch it inside the hasRichUpdates block or separately.
             // For efficiency, let's assume the caller knows what they are doing
             // or check against local cache if available?
             
             // Let's assume updateTodoDoneStatus TOGGLES.
             // And we want to set it to 'Done' or 'In Progress'.
             // We'll do a separate query to check current status first.
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

    const hasRichUpdates = updates.description !== undefined || updates.workType !== undefined ||
                           updates.targetOutcome !== undefined || updates.activities !== undefined ||
                           updates.resources !== undefined || updates.position !== undefined;

    if (hasRichUpdates) {
      try {
        // Fetch current task from cloud to get existing metadata
        const currentTaskQuery = `
          query GetTodo($id: String!) {
            todo(id: $id) {
              text
            }
          }
        `;
        const currentResult = await this.query(currentTaskQuery, { id: taskId });

        let currentWorkData = {};
        let currentDescription = '';

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
                        currentWorkData = JSON.parse(jsonMeta);
                    } catch(e) {}
                }
           } else {
               // Try legacy
               try {
                   const parsed = JSON.parse(text);
                   if (parsed.workData) {
                       currentDescription = parsed.desc || '';
                       currentWorkData = parsed.workData;
                   } else {
                       currentDescription = text;
                   }
               } catch (e) {
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

        // Serialize back to text with Base64
        const base64Meta = Buffer.from(JSON.stringify(mergedWorkData)).toString('base64');
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
            if (input.text && input.text.includes('---PMT-META---')) {
                 try {
                     const b64 = input.text.split('---PMT-META---')[1].trim();
                     returnWorkData = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
                 } catch(e) {}
            }

            return {
                success: true,
                data: {
                    id: todo.id,
                    title: todo.title,
                    description: updates.description !== undefined ? updates.description : (todo.text ? (todo.text.includes('---PMT-META---') ? todo.text.split('---PMT-META---')[0].trim() : todo.text) : ''),
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
                    
                    ...updates
                }
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
      // Cloud create tag
      return { success: true, data: { name, color } };
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
      // Cloud add tag to task
      // Needs finding tag ID and associating
      return { success: true };
  }

  // --- Relationship Management ---

  async createTaskRelationship(fromTaskId, toTaskId, type) {
    // Check if tasks exist (local or cloud) - simplistic check
    // In a real scenario, we might verify against cloud if not in local mode
    
    // Prevent duplicates
    const exists = this.localRelationships.find(
      r => r.fromTaskId === fromTaskId && r.toTaskId === toTaskId && r.type === type
    );

    if (exists) {
      return { success: true, data: exists };
    }

    const newRel = {
      id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromTaskId,
      toTaskId,
      type,
      createdAt: new Date().toISOString()
    };

    this.localRelationships.push(newRel);
    await this.saveLocalStore();
    return { success: true, data: newRel };
  }

  async getTaskRelationships(taskId) {
    const relationships = this.localRelationships.filter(
      r => r.fromTaskId === taskId || r.toTaskId === taskId
    );
    
    // Enrich with task details if needed, but for now just return the links
    // The frontend might need to fetch the related task details
    return { success: true, data: relationships };
  }
  
  async deleteRelationship(relationshipId) {
      this.localRelationships = this.localRelationships.filter(r => r.id !== relationshipId);
      await this.saveLocalStore();
      return { success: true };
  }

  async getAllRelationships() {
      return { success: true, data: this.localRelationships };
  }

  // --- Milestone Management ---

  async linkTaskToMilestone(taskId, milestoneId) {
      // Prevent duplicates
      const exists = this.localMilestoneLinks.find(
          l => l.taskId === taskId && l.milestoneId === milestoneId
      );
      
      if (exists) return { success: true, data: exists };

      const link = {
          taskId,
          milestoneId,
          createdAt: new Date().toISOString()
      };
      
      this.localMilestoneLinks.push(link);
      await this.saveLocalStore();
      return { success: true, data: link };
  }

  async getTasksForMilestone(milestoneId) {
      const links = this.localMilestoneLinks.filter(l => l.milestoneId === milestoneId);
      const taskIds = links.map(l => l.taskId);
      
      // Need to fetch actual task objects
      // For local mode, it's easy. For cloud, we might need to batch fetch or filter
      // Here we assume getTasks() returns everything we need for now (optimization later)
      const allTasksResult = await this.getTasks();
      if (!allTasksResult.success) return { success: false, error: 'Failed to fetch tasks' };
      
      const tasks = allTasksResult.data.filter(t => taskIds.includes(t.id));
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