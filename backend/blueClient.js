import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

const BLUE_API_ENDPOINT = 'https://api.blue.cc/graphql';

// Dimension tags with their colors (for reference when creating tags)
const DIMENSION_TAGS = {
  SUBSTACK: { name: 'substack', color: '#FF6719' },
  NEWSLETTER: { name: 'newsletter', color: '#3B82F6' },
  BOOKS: { name: 'books', color: '#6366F1' },
  PRACTICE: { name: 'practice', color: '#10B981' },
  STONE: { name: 'stone', color: '#10B981' },
  WALK: { name: 'walk', color: '#34D399' },
  B2B: { name: 'b2b', color: '#6EE7B7' },
  COMMUNITY: { name: 'community', color: '#EC4899' },
  MISSION: { name: 'mission', color: '#EC4899' },
  DEVELOPMENT: { name: 'development', color: '#F472B6' },
  FIRST30: { name: 'first30', color: '#FBCFE8' },
  MARKETING: { name: 'marketing', color: '#F59E0B' },
  BOPA: { name: 'bopa', color: '#F59E0B' },
  WEBSITE: { name: 'website', color: '#FBBF24' },
  MARKETING_OTHER: { name: 'marketing-other', color: '#FDE68A' },
  ADMIN: { name: 'admin', color: '#8B5CF6' },
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
  }

  // --- Core GraphQL Query Method ---
  async query(query, variables = {}, options = {}) {
    try {
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

  // --- Connection Test ---
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
      console.log('Blue.cc API connection successful!');
      await this.ensureWorkspace();
      return true;
    } else {
      console.error('Blue.cc API connection failed:', result.error);
      return false;
    }
  }

  // --- Workspace Setup ---
  async ensureWorkspace() {
    try {
      await this.getCompanyId();
      await this.getDefaultProjectId();
      await this.getDefaultTodoListId();
      console.log('Blue.cc workspace configured successfully!');
      return true;
    } catch (error) {
      console.error('Workspace setup failed:', error);
      return false;
    }
  }

  async getCompanyId() {
    if (this.companyId) return this.companyId;

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
    if (result.success && result.data.recentProjects?.length > 0) {
      this.companyId = result.data.recentProjects[0].company.id;
      this.companyUid = result.data.recentProjects[0].company.uid;
      console.log(`Found company: ${result.data.recentProjects[0].company.name}`);
      return this.companyId;
    }
    throw new Error('No company found');
  }

  async getDefaultProjectId() {
    if (this.defaultProjectId) return this.defaultProjectId;

    if (process.env.BLUE_PROJECT_ID) {
      this.defaultProjectId = process.env.BLUE_PROJECT_ID;
      return this.defaultProjectId;
    }

    const query = `
      query GetRecentProjects {
        recentProjects {
          id
          uid
          name
        }
      }
    `;

    const result = await this.query(query, {}, { skipCompanyHeader: true });
    if (result.success && result.data.recentProjects?.length > 0) {
      this.defaultProjectId = result.data.recentProjects[0].id;
      this.defaultProjectUid = result.data.recentProjects[0].uid;
      console.log(`Using project: ${result.data.recentProjects[0].name}`);
      return this.defaultProjectId;
    }
    throw new Error('No project found');
  }

  async getDefaultTodoListId() {
    if (this.defaultTodoListId) return this.defaultTodoListId;

    if (process.env.BLUE_TODO_LIST_ID) {
      this.defaultTodoListId = process.env.BLUE_TODO_LIST_ID;
      return this.defaultTodoListId;
    }

    const projectId = await this.getDefaultProjectId();

    // Use the todoLists query with projectId parameter (not project.todoLists)
    const query = `
      query GetTodoLists($projectId: String!) {
        todoLists(projectId: $projectId) {
          id
          title
        }
      }
    `;

    const result = await this.query(query, { projectId });
    if (result.success && result.data.todoLists?.length > 0) {
      this.defaultTodoListId = result.data.todoLists[0].id;
      console.log(`Using TodoList: ${result.data.todoLists[0].title}`);
      return this.defaultTodoListId;
    }

    throw new Error('No todo list found');
  }

  async getWorkspaces() {
    try {
      const id = await this.getCompanyId();
      return { success: true, data: [{ id, name: 'Blue.cc Workspace' }] };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // --- Task Management ---

  async getTasks(filters = {}) {
    try {
      const todoListId = await this.getDefaultTodoListId();

      const query = `
        query GetTodos($todoListId: String!) {
          todoList(id: $todoListId) {
            todos {
              id
              title
              text
              html
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

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Transform Blue.cc todos to our task format
      let tasks = result.data.todoList.todos.map(todo => {
        // --- DATA PERSISTENCE STRATEGY ---
        // Blue.cc's internal architecture has a delay (eventual consistency) when converting
        // the rich-text 'html' field to the plain 'text' field.
        // Since we write our Base64 metadata to the 'html' field, the 'text' field might be
        // stale immediately after a write.
        // Therefore, we treat 'html' as the Source of Truth if it contains our metadata marker.
        // This ensures the frontend always receives the most recent state even after a hard refresh.
        const source = (todo.html && todo.html.includes('---PMT-META---')) ? todo.html : todo.text;
        const { description, metadata } = this.parseTaskText(source);

        return {
          id: todo.id,
          title: todo.title,
          description,
          status: todo.done ? 'Done' : 'In Progress',
          dueDate: todo.duedAt,
          startDate: todo.startedAt,
          tags: todo.tags?.map(t => t.title) || [],
          position: metadata.position || { x: 0, y: 0 },
          gridPosition: metadata.gridPosition,
          createdAt: todo.createdAt,
          updatedAt: todo.updatedAt,
          deletedAt: metadata.deletedAt,
          workType: metadata.workType,
          targetOutcome: metadata.targetOutcome,
          activities: metadata.activities || [],
          resources: metadata.resources || {}
        };
      });

      // Filter out soft-deleted tasks (unless includeDeleted filter is set)
      if (!filters.includeDeleted) {
        tasks = tasks.filter(t => !t.deletedAt);
      }

      // Apply filters
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
        tasks = tasks.filter(t => t.tags?.some(tag => tag.toLowerCase().includes(dim)));
      }

      return { success: true, data: tasks };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { success: false, error: error.message };
    }
  }

  async createTask(taskData) {
    try {
      const todoListId = await this.getDefaultTodoListId();

      // Encode metadata in the description
      const textContent = this.buildTaskText(taskData.description, {
        workType: taskData.workType,
        targetOutcome: taskData.targetOutcome,
        activities: taskData.activities,
        resources: taskData.resources,
        position: taskData.position
      });

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
        description: textContent,
        duedAt: taskData.dueDate ? this.formatDate(taskData.dueDate) : null,
        startedAt: taskData.startDate ? this.formatDate(taskData.startDate) : null
      };

      const result = await this.query(mutation, { input });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const todo = result.data.createTodo;

      // Add tags if provided
      if (taskData.tags?.length > 0) {
        for (const tagName of taskData.tags) {
          await this.addTagToTask(todo.id, tagName);
        }
      }

      return {
        success: true,
        data: {
          id: todo.id,
          title: todo.title,
          description: taskData.description || '',
          status: 'In Progress',
          dueDate: todo.duedAt,
          startDate: todo.startedAt,
          tags: taskData.tags || [],
          workType: taskData.workType,
          targetOutcome: taskData.targetOutcome,
          activities: taskData.activities || [],
          resources: taskData.resources || {},
          position: taskData.position || { x: 0, y: 0 },
          createdAt: todo.createdAt,
          updatedAt: todo.updatedAt
        }
      };
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTask(taskId, updates) {
    try {
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
      if (updates.dueDate) input.duedAt = this.formatDate(updates.dueDate);
      if (updates.startDate) input.startedAt = this.formatDate(updates.startDate);

      // Handle status change
      if (updates.status) {
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
      }

      // Handle rich metadata updates
      const hasRichUpdates = updates.description !== undefined ||
                            updates.workType !== undefined ||
                            updates.targetOutcome !== undefined ||
                            updates.activities !== undefined ||
                            updates.resources !== undefined ||
                            updates.position !== undefined ||
                            updates.gridPosition !== undefined;

      if (hasRichUpdates) {
        // Fetch current task to merge metadata
        const currentQuery = `query GetTodo($id: String!) { todo(id: $id) { text } }`;
        const currentResult = await this.query(currentQuery, { id: taskId });

        let currentDescription = '';
        let currentMetadata = {};

        if (currentResult.success) {
          const parsed = this.parseTaskText(currentResult.data.todo.text);
          currentDescription = parsed.description;
          currentMetadata = parsed.metadata;
        }

        // Merge updates with current data
        const mergedMetadata = {
          workType: updates.workType !== undefined ? updates.workType : currentMetadata.workType,
          targetOutcome: updates.targetOutcome !== undefined ? updates.targetOutcome : currentMetadata.targetOutcome,
          activities: updates.activities !== undefined ? updates.activities : currentMetadata.activities,
          resources: updates.resources !== undefined ? updates.resources : currentMetadata.resources,
          position: updates.position !== undefined ? updates.position : currentMetadata.position,
          gridPosition: updates.gridPosition !== undefined ? updates.gridPosition : currentMetadata.gridPosition
        };

        const mergedDescription = updates.description !== undefined ? updates.description : currentDescription;
        // Blue.cc uses 'html' field for description content (text is computed)
        input.html = this.buildTaskText(mergedDescription, mergedMetadata);
      }

      // Only run edit mutation if there are updates
      if (Object.keys(input).length > 1) {
        const result = await this.query(mutation, { input });

        if (!result.success) {
          return { success: false, error: result.error };
        }

        const todo = result.data.editTodo;
        const { description, metadata } = this.parseTaskText(todo.text);

        return {
          success: true,
          data: {
            id: todo.id,
            title: todo.title,
            description,
            status: todo.done ? 'Done' : 'In Progress',
            dueDate: todo.duedAt,
            startDate: todo.startedAt,
            tags: todo.tags?.map(t => t.title) || [],
            updatedAt: todo.updatedAt,
            workType: metadata.workType,
            targetOutcome: metadata.targetOutcome,
            activities: metadata.activities || [],
            resources: metadata.resources || {},
            position: metadata.position,
            ...updates
          }
        };
      }

      return { success: true, data: { id: taskId, ...updates } };
    } catch (error) {
      console.error('Error updating task:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteTask(taskId, permanent = false) {
    try {
      if (permanent) {
        // Hard delete - actually remove from Blue.cc
        const mutation = `
          mutation DeleteTodo($input: DeleteTodoInput!) {
            deleteTodo(input: $input) {
              success
            }
          }
        `;

        const result = await this.query(mutation, { input: { todoId: taskId } });

        if (!result.success) {
          return { success: false, error: result.error };
        }

        return { success: true, data: { id: taskId } };
      } else {
        // Soft delete - set deletedAt timestamp in metadata
        const deletedAt = new Date().toISOString();
        const result = await this.updateTask(taskId, { deletedAt });

        if (!result.success) {
          return { success: false, error: result.error };
        }

        return { success: true, data: { id: taskId, deletedAt } };
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      return { success: false, error: error.message };
    }
  }

  async restoreTask(taskId) {
    try {
      // Remove deletedAt from metadata to restore the task
      const result = await this.updateTask(taskId, { deletedAt: null });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error restoring task:', error);
      return { success: false, error: error.message };
    }
  }

  async getDeletedTasks() {
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

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Filter to only deleted tasks
      const deletedTasks = result.data.todoList.todos
        .map(todo => {
          const { description, metadata } = this.parseTaskText(todo.text);
          return {
            id: todo.id,
            title: todo.title,
            description,
            status: todo.done ? 'Done' : 'In Progress',
            dueDate: todo.duedAt,
            startDate: todo.startedAt,
            tags: todo.tags?.map(t => t.title) || [],
            position: metadata.position || { x: 0, y: 0 },
            createdAt: todo.createdAt,
            updatedAt: todo.updatedAt,
            deletedAt: metadata.deletedAt,
            workType: metadata.workType,
            targetOutcome: metadata.targetOutcome,
            activities: metadata.activities || [],
            resources: metadata.resources || {}
          };
        })
        .filter(task => task.deletedAt);

      return { success: true, data: deletedTasks };
    } catch (error) {
      console.error('Error fetching deleted tasks:', error);
      return { success: false, error: error.message };
    }
  }

  async emptyTrash(olderThanDays = null) {
    try {
      const deletedResult = await this.getDeletedTasks();
      if (!deletedResult.success) {
        return { success: false, error: deletedResult.error };
      }

      let tasksToDelete = deletedResult.data;

      // If olderThanDays specified, only delete tasks older than that
      if (olderThanDays !== null) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        tasksToDelete = tasksToDelete.filter(task =>
          new Date(task.deletedAt) < cutoffDate
        );
      }

      // Permanently delete each task
      const results = [];
      for (const task of tasksToDelete) {
        const result = await this.deleteTask(task.id, true);
        results.push({ id: task.id, success: result.success });
      }

      return {
        success: true,
        data: {
          deleted: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      };
    } catch (error) {
      console.error('Error emptying trash:', error);
      return { success: false, error: error.message };
    }
  }

  // --- Tag Management ---

  async getTags() {
    try {
      const query = `
        query GetTags {
          tags {
            id
            title
            color
          }
        }
      `;

      const result = await this.query(query);

      if (!result.success) {
        // Return default dimension tags on failure
        return { success: true, data: Object.values(DIMENSION_TAGS) };
      }

      return {
        success: true,
        data: result.data.tags.map(t => ({
          name: t.title,
          color: t.color,
          id: t.id
        }))
      };
    } catch (error) {
      return { success: true, data: Object.values(DIMENSION_TAGS) };
    }
  }

  async createTag(name, color) {
    try {
      const mutation = `
        mutation CreateTag($input: CreateTagInput!) {
          createTag(input: $input) {
            id
            title
            color
          }
        }
      `;

      const result = await this.query(mutation, {
        input: { title: name, color: color || '#888888' }
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        data: {
          id: result.data.createTag.id,
          name: result.data.createTag.title,
          color: result.data.createTag.color
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addTagToTask(taskId, tagName) {
    try {
      // Get existing tags (global list)
      const tagsQuery = `query GetTags { tags { id title color } }`;
      const tagsResult = await this.query(tagsQuery);

      let tagId = null;

      if (tagsResult.success) {
        const existingTag = tagsResult.data.tags.find(t => t.title === tagName);
        if (existingTag) {
          tagId = existingTag.id;
        }
      }

      // Create tag if it doesn't exist
      if (!tagId) {
        const dimensionTag = Object.values(DIMENSION_TAGS).find(t => t.name === tagName);
        const color = dimensionTag ? dimensionTag.color : '#888888';

        const createResult = await this.createTag(tagName, color);
        if (createResult.success) {
          tagId = createResult.data.id;
        } else {
          return { success: false, error: 'Failed to create tag' };
        }
      }

      // Get current tags of the todo to preserve them
      const todoQuery = `query GetTodoTags($id: String!) { todo(id: $id) { tags { id } } }`;
      const todoResult = await this.query(todoQuery, { id: taskId });
      
      let currentTagIds = [];
      if (todoResult.success && todoResult.data.todo && todoResult.data.todo.tags) {
        currentTagIds = todoResult.data.todo.tags.map(t => t.id);
      }

      if (currentTagIds.includes(tagId)) {
        return { success: true, data: { message: 'Tag already added' } };
      }

      // Set tags
      const mutation = `
        mutation SetTodoTags($input: SetTodoTagsInput!) {
          setTodoTags(input: $input)
        }
      `;

      const result = await this.query(mutation, {
        input: { todoId: taskId, tagIds: [...currentTagIds, tagId] }
      });

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // --- Relationship Management (stored as comments) ---

  async createTaskRelationship(fromTaskId, toTaskId, type, label = null) {
    try {
      const relId = `rel-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newRel = {
        id: relId,
        fromTaskId,
        toTaskId,
        type,
        label,
        createdAt: new Date().toISOString()
      };

      // Store as comment in Blue.cc
      const metadataJson = JSON.stringify(newRel);
      const base64Metadata = Buffer.from(metadataJson).toString('base64');
      const text = `[PMT Relationship] ${type}${label ? ': ' + label : ''} -> ${toTaskId}`;
      const html = `<div data-pmt-relationship="${relId}">${base64Metadata}</div>`;

      const commentResult = await this.createComment(fromTaskId, text, html);

      if (commentResult.success) {
        newRel.commentId = commentResult.data.id;
      }

      return { success: true, data: newRel };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAllRelationships() {
    try {
      // Fetch all tasks to get their comments
      const tasksResult = await this.getTasks();
      if (!tasksResult.success) {
        return { success: false, error: tasksResult.error };
      }

      const relationships = [];

      // Fetch comments for each task
      for (const task of tasksResult.data) {
        const commentsResult = await this.getCommentsForTodo(task.id);
        if (commentsResult.success) {
          for (const comment of commentsResult.data) {
            if (comment.html?.includes('data-pmt-relationship=')) {
              try {
                const base64Match = comment.html.match(/>([A-Za-z0-9+/=]+)</);
                if (base64Match) {
                  const jsonString = Buffer.from(base64Match[1], 'base64').toString('utf-8');
                  const relData = JSON.parse(jsonString);
                  relData.commentId = comment.id;
                  relationships.push(relData);
                }
              } catch (e) {
                console.error('Failed to parse relationship comment:', e);
              }
            }
          }
        }
      }

      return { success: true, data: relationships };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTaskRelationships(taskId) {
    try {
      const allRels = await this.getAllRelationships();
      if (!allRels.success) {
        return allRels;
      }

      const filtered = allRels.data.filter(
        r => r.fromTaskId === taskId || r.toTaskId === taskId
      );

      return { success: true, data: filtered };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteRelationship(relationshipId) {
    try {
      // Find the relationship to get its commentId
      const allRels = await this.getAllRelationships();
      if (!allRels.success) {
        return { success: false, error: 'Failed to fetch relationships' };
      }

      const rel = allRels.data.find(r => r.id === relationshipId);
      if (!rel) {
        return { success: false, error: 'Relationship not found' };
      }

      // Delete the comment
      if (rel.commentId) {
        await this.deleteComment(rel.commentId);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // --- Comment Management ---

  async createComment(todoId, text, html = null) {
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

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return { success: true, data: result.data.createComment };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getCommentsForTodo(todoId) {
    try {
      const query = `
        query GetComments($categoryId: String!, $category: CommentCategory!) {
          commentList(categoryId: $categoryId, category: $category) {
            id
            text
            html
            createdAt
          }
        }
      `;

      const result = await this.query(query, {
        categoryId: todoId,
        category: 'TODO'
      });

      if (!result.success) {
        return { success: true, data: [] };
      }

      return { success: true, data: result.data.commentList || [] };
    } catch (error) {
      return { success: true, data: [] };
    }
  }

  async deleteComment(commentId) {
    try {
      const mutation = `
        mutation DeleteComment($id: String!) {
          deleteComment(id: $id)
        }
      `;

      const result = await this.query(mutation, { id: commentId });
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // --- Milestone Management ---

  async linkTaskToMilestone(taskId, milestoneId) {
    try {
      const link = {
        taskId,
        milestoneId,
        createdAt: new Date().toISOString()
      };

      const metadataJson = JSON.stringify(link);
      const base64Metadata = Buffer.from(metadataJson).toString('base64');
      const text = `[PMT Milestone] Linked to ${milestoneId}`;
      const html = `<div data-pmt-milestone="${milestoneId}">${base64Metadata}</div>`;

      const result = await this.createComment(taskId, text, html);

      if (result.success) {
        link.commentId = result.data.id;
      }

      return { success: true, data: link };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTasksForMilestone(milestoneId) {
    try {
      const tasksResult = await this.getTasks();
      if (!tasksResult.success) {
        return { success: false, error: tasksResult.error };
      }

      const linkedTasks = [];

      for (const task of tasksResult.data) {
        const commentsResult = await this.getCommentsForTodo(task.id);
        if (commentsResult.success) {
          const hasMilestoneLink = commentsResult.data.some(
            c => c.html?.includes(`data-pmt-milestone="${milestoneId}"`)
          );
          if (hasMilestoneLink) {
            linkedTasks.push(task);
          }
        }
      }

      return { success: true, data: linkedTasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMilestoneProgress(milestoneId) {
    const result = await this.getTasksForMilestone(milestoneId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const tasks = result.data;
    if (tasks.length === 0) {
      return { success: true, data: { progress: 0, total: 0, completed: 0 } };
    }

    const completed = tasks.filter(t => t.status === 'Done').length;
    const progress = Math.round((completed / tasks.length) * 100);

    return { success: true, data: { progress, total: tasks.length, completed } };
  }

  // --- Readiness Calculation ---

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

  // --- Utility Methods ---

  parseTaskText(text) {
    if (!text) {
      return { description: '', metadata: {} };
    }

    const metaMarker = '---PMT-META---';

    if (text.includes(metaMarker)) {
      const parts = text.split(metaMarker);
      // If extracting from HTML, description might have tags, that's fine.
      // But metadata MUST be clean Base64.
      const description = parts[0].trim();
      
      // Strip HTML tags and whitespace from the metadata part
      const rawMeta = parts[1] || '';
      const base64Meta = rawMeta.replace(/<[^>]*>/g, '').replace(/\s/g, '');

      if (base64Meta) {
        try {
          const jsonMeta = Buffer.from(base64Meta, 'base64').toString('utf-8');
          const parsed = JSON.parse(jsonMeta);
          return {
            description,
            metadata: {
              workType: parsed.wt || parsed.workType,
              targetOutcome: parsed.to || parsed.targetOutcome,
              activities: parsed.a || parsed.activities || [],
              resources: parsed.r || parsed.resources || {},
              position: parsed.p || parsed.position,
              gridPosition: parsed.g || parsed.gridPosition,
              deletedAt: parsed.d || parsed.deletedAt
            }
          };
        } catch (e) {
          return { description: text, metadata: {} };
        }
      }
    }

    return { description: text, metadata: {} };
  }

  buildTaskText(description, metadata) {
    if (!metadata || Object.keys(metadata).every(k => !metadata[k])) {
      return description || '';
    }

    // Use compact format to save space
    const compactMeta = {
      wt: metadata.workType,
      to: metadata.targetOutcome,
      a: metadata.activities || [],
      r: metadata.resources || {},
      p: metadata.position,
      g: metadata.gridPosition,
      d: metadata.deletedAt
    };

    // Remove null/undefined values
    Object.keys(compactMeta).forEach(k => {
      if (compactMeta[k] === null || compactMeta[k] === undefined) {
        delete compactMeta[k];
      }
    });

    const base64Meta = Buffer.from(JSON.stringify(compactMeta)).toString('base64');
    return `${description || ''}\n\n---PMT-META---\n${base64Meta}`;
  }

  formatDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr.includes('T')) return dateStr;
    return `${dateStr}T09:00:00.000Z`;
  }

  async executeQuery(query, variables = {}) {
    return this.query(query, variables);
  }
}

export default new BlueClient();
