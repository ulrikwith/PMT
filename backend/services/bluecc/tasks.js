import coreClient from './core.js';
import { parseTaskText, buildTaskText } from './utils.js';
import tagsService from './tags.js';
import customFieldService from './customFields.js';

class TaskService {
  constructor() {
    this.mutexes = new Map(); // taskId -> Promise
  }

  // Mutex implementation to serialize updates per task
  async withLock(taskId, action) {
    if (!this.mutexes.has(taskId)) {
      this.mutexes.set(taskId, Promise.resolve());
    }

    const currentLock = this.mutexes.get(taskId);
    const nextLock = currentLock
      .then(() => action())
      .catch((error) => {
        console.error(`Mutex action failed for task ${taskId}:`, error);
        throw error; // Re-throw to propagate error to caller
      })
      .finally(() => {
        // Clean up mutex if no other operations are pending
        if (this.mutexes.get(taskId) === nextLock) {
          this.mutexes.delete(taskId);
        }
      });

    this.mutexes.set(taskId, nextLock);
    return nextLock;
  }

  async getTasks(filters = {}) {
    try {
      const todoListId = await coreClient.getDefaultTodoListId();

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
              customFields {
                id
                name
                value
              }
              createdAt
              updatedAt
              duedAt
              startedAt
            }
          }
        }
      `;

      const result = await coreClient.query(query, { todoListId });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Validate response structure
      if (!result.data || !result.data.todoList || !Array.isArray(result.data.todoList.todos)) {
        console.error('Invalid API response structure:', result);
        return { success: false, error: 'Invalid response structure from API' };
      }

      let tasks = result.data.todoList.todos.map((todo) => {
        const source = todo.html && todo.html.includes('---PMT-META---') ? todo.html : todo.text;
        const { description, metadata } = parseTaskText(source);

        // Parse Custom Fields
        let relationships = [];
        let milestones = [];

        if (todo.customFields && Array.isArray(todo.customFields)) {
          const relField = todo.customFields.find((f) => f && f.name === 'PMT_Relationships');
          if (relField && relField.value) {
            try {
              const parsed =
                typeof relField.value === 'string' ? JSON.parse(relField.value) : relField.value;
              if (Array.isArray(parsed)) {
                relationships = parsed;
              } else {
                console.warn(
                  `Task ${todo.id}: PMT_Relationships is not an array, got:`,
                  typeof parsed
                );
              }
            } catch (e) {
              console.error(
                `Task ${todo.id}: Failed to parse PMT_Relationships:`,
                e.message,
                'Value:',
                relField.value
              );
            }
          }

          const msField = todo.customFields.find((f) => f && f.name === 'PMT_Milestones');
          if (msField && msField.value) {
            try {
              const parsed =
                typeof msField.value === 'string' ? JSON.parse(msField.value) : msField.value;
              if (Array.isArray(parsed)) {
                milestones = parsed;
              } else {
                console.warn(
                  `Task ${todo.id}: PMT_Milestones is not an array, got:`,
                  typeof parsed
                );
              }
            } catch (e) {
              console.error(
                `Task ${todo.id}: Failed to parse PMT_Milestones:`,
                e.message,
                'Value:',
                msField.value
              );
            }
          }
        }

        return {
          id: todo.id,
          title: todo.title,
          description,
          status: todo.done ? 'Done' : 'In Progress',
          dueDate: todo.duedAt,
          startDate: todo.startedAt,
          tags: todo.tags?.map((t) => t.title) || [],
          position: metadata.position || { x: 0, y: 0 },
          gridPosition: metadata.gridPosition,
          createdAt: todo.createdAt,
          updatedAt: todo.updatedAt,
          deletedAt: metadata.deletedAt,
          workType: metadata.workType,
          targetOutcome: metadata.targetOutcome,
          activities: metadata.activities || [],
          resources: metadata.resources || {},
          relationships,
          milestones,
          sortOrder: metadata.sortOrder || 0,
        };
      });

      if (!filters.includeDeleted) {
        tasks = tasks.filter((t) => !t.deletedAt);
      }

      if (filters.search) {
        const lowerSearch = filters.search.toLowerCase();
        tasks = tasks.filter(
          (t) =>
            (t.title || '').toLowerCase().includes(lowerSearch) ||
            (t.description || '').toLowerCase().includes(lowerSearch)
        );
      }

      if (filters.status) {
        tasks = tasks.filter((t) => t.status === filters.status);
      }

      if (filters.dimension) {
        const dim = filters.dimension.toLowerCase();
        tasks = tasks.filter((t) => t.tags?.some((tag) => tag.toLowerCase().includes(dim)));
      }

      return { success: true, data: tasks };
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return { success: false, error: error.message };
    }
  }

  async createTask(taskData) {
    try {
      const todoListId = await coreClient.getDefaultTodoListId();

      const textContent = buildTaskText(taskData.description, {
        workType: taskData.workType,
        targetOutcome: taskData.targetOutcome,
        activities: taskData.activities,
        resources: taskData.resources,
        position: taskData.position,
        sortOrder: taskData.sortOrder,
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

      // Prepare Custom Fields for creation
      const customFieldsInput = [];

      if (taskData.relationships?.length > 0) {
        const relId = await customFieldService.getFieldId('PMT_Relationships');
        if (relId) {
          customFieldsInput.push({
            customFieldId: relId,
            value:
              typeof taskData.relationships === 'string'
                ? taskData.relationships
                : JSON.stringify(taskData.relationships),
          });
        }
      }

      if (taskData.milestones?.length > 0) {
        const msId = await customFieldService.getFieldId('PMT_Milestones');
        if (msId) {
          customFieldsInput.push({
            customFieldId: msId,
            value:
              typeof taskData.milestones === 'string'
                ? taskData.milestones
                : JSON.stringify(taskData.milestones),
          });
        }
      }

      const input = {
        todoListId,
        title: taskData.title,
        description: textContent,
        duedAt: taskData.dueDate ? coreClient.formatDate(taskData.dueDate) : null,
        startedAt: taskData.startDate ? coreClient.formatDate(taskData.startDate) : null,
        customFields: customFieldsInput,
      };

      const result = await coreClient.query(mutation, { input });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const todo = result.data.createTodo;

      // Set Tags
      if (taskData.tags?.length > 0) {
        for (const tagName of taskData.tags) {
          await tagsService.addTagToTask(todo.id, tagName);
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
          relationships: taskData.relationships || [],
          milestones: taskData.milestones || [],
          position: taskData.position || { x: 0, y: 0 },
          sortOrder: taskData.sortOrder || 0,
          createdAt: todo.createdAt,
          updatedAt: todo.updatedAt,
        },
      };
    } catch (error) {
      console.error('Error creating task:', error);
      return { success: false, error: error.message };
    }
  }

  async updateTask(taskId, updates) {
    return this.withLock(taskId, async () => {
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
        if (updates.dueDate) input.duedAt = coreClient.formatDate(updates.dueDate);
        if (updates.startDate) input.startedAt = coreClient.formatDate(updates.startDate);

        if (updates.status) {
          const statusQuery = `query GetStatus($id: String!) { todo(id: $id) { done } }`;
          const statusRes = await coreClient.query(statusQuery, { id: taskId });

          if (statusRes.success) {
            const currentDone = statusRes.data.todo.done;
            const targetDone = updates.status === 'Done';

            if (currentDone !== targetDone) {
              const toggleMutation = `mutation Toggle($id: String!) { updateTodoDoneStatus(todoId: $id) { id done } }`;
              await coreClient.query(toggleMutation, { id: taskId });
            }
          }
        }

        const hasRichUpdates =
          updates.description !== undefined ||
          updates.workType !== undefined ||
          updates.targetOutcome !== undefined ||
          updates.activities !== undefined ||
          updates.resources !== undefined ||
          updates.position !== undefined ||
          updates.gridPosition !== undefined ||
          updates.deletedAt !== undefined ||
          updates.sortOrder !== undefined;

        if (hasRichUpdates) {
          const currentQuery = `query GetTodo($id: String!) { todo(id: $id) { text } }`;
          const currentResult = await coreClient.query(currentQuery, { id: taskId });

          let currentDescription = '';
          let currentMetadata = {};

          if (currentResult.success) {
            const parsed = parseTaskText(currentResult.data.todo.text);
            currentDescription = parsed.description;
            currentMetadata = parsed.metadata;
          }

          const mergedMetadata = {
            workType: updates.workType !== undefined ? updates.workType : currentMetadata.workType,
            targetOutcome:
              updates.targetOutcome !== undefined
                ? updates.targetOutcome
                : currentMetadata.targetOutcome,
            activities:
              updates.activities !== undefined ? updates.activities : currentMetadata.activities,
            resources:
              updates.resources !== undefined ? updates.resources : currentMetadata.resources,
            position: updates.position !== undefined ? updates.position : currentMetadata.position,
            gridPosition:
              updates.gridPosition !== undefined
                ? updates.gridPosition
                : currentMetadata.gridPosition,
            deletedAt:
              updates.deletedAt !== undefined ? updates.deletedAt : currentMetadata.deletedAt,
            sortOrder:
              updates.sortOrder !== undefined ? updates.sortOrder : currentMetadata.sortOrder,
          };

          const mergedDescription =
            updates.description !== undefined ? updates.description : currentDescription;
          input.html = buildTaskText(mergedDescription, mergedMetadata);
        }

        // Handle Custom Fields Updates
        try {
          if (updates.relationships !== undefined) {
            const res = await customFieldService.setTaskValue(
              taskId,
              'PMT_Relationships',
              updates.relationships
            );
            if (!res.success) console.error('Failed to update Relationships CF:', res.error);
          }
          if (updates.milestones !== undefined) {
            const res = await customFieldService.setTaskValue(
              taskId,
              'PMT_Milestones',
              updates.milestones
            );
            if (!res.success) console.error('Failed to update Milestones CF:', res.error);
          }
        } catch (e) {
          console.error('Error updating custom fields:', e);
        }

        if (Object.keys(input).length > 1) {
          const result = await coreClient.query(mutation, { input });

          if (!result.success) {
            return { success: false, error: result.error };
          }

          const todo = result.data.editTodo;
          const { description, metadata } = parseTaskText(todo.text);

          return {
            success: true,
            data: {
              id: todo.id,
              title: todo.title,
              description,
              status: todo.done ? 'Done' : 'In Progress',
              dueDate: todo.duedAt,
              startDate: todo.startedAt,
              tags: todo.tags?.map((t) => t.title) || [],
              updatedAt: todo.updatedAt,
              workType: metadata.workType,
              targetOutcome: metadata.targetOutcome,
              activities: metadata.activities || [],
              resources: metadata.resources || {},
              relationships: metadata.relationships || [],
              milestones: metadata.milestones || [],
              position: metadata.position,
              sortOrder: metadata.sortOrder,
              ...updates,
            },
          };
        }

        return { success: true, data: { id: taskId, ...updates } };
      } catch (error) {
        console.error('Error updating task:', error);
        return { success: false, error: error.message };
      }
    });
  }

  async deleteTask(taskId, permanent = false) {
    try {
      if (permanent) {
        const mutation = `
          mutation DeleteTodo($input: DeleteTodoInput!) {
            deleteTodo(input: $input) {
              success
            }
          }
        `;

        const result = await coreClient.query(mutation, { input: { todoId: taskId } });

        if (!result.success) {
          return { success: false, error: result.error };
        }

        return { success: true, data: { id: taskId } };
      } else {
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
      const todoListId = await coreClient.getDefaultTodoListId();

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

      const result = await coreClient.query(query, { todoListId });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const deletedTasks = result.data.todoList.todos
        .map((todo) => {
          const { description, metadata } = parseTaskText(todo.text);
          return {
            id: todo.id,
            title: todo.title,
            description,
            status: todo.done ? 'Done' : 'In Progress',
            dueDate: todo.duedAt,
            startDate: todo.startedAt,
            tags: todo.tags?.map((t) => t.title) || [],
            position: metadata.position || { x: 0, y: 0 },
            createdAt: todo.createdAt,
            updatedAt: todo.updatedAt,
            deletedAt: metadata.deletedAt,
            workType: metadata.workType,
            targetOutcome: metadata.targetOutcome,
            activities: metadata.activities || [],
            resources: metadata.resources || {},
            relationships: metadata.relationships || [],
            milestones: metadata.milestones || [],
          };
        })
        .filter((task) => task.deletedAt);

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

      if (olderThanDays !== null) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        tasksToDelete = tasksToDelete.filter((task) => new Date(task.deletedAt) < cutoffDate);
      }

      const results = [];
      for (const task of tasksToDelete) {
        const result = await this.deleteTask(task.id, true);
        results.push({ id: task.id, success: result.success });
      }

      return {
        success: true,
        data: {
          deleted: results.filter((r) => r.success).length,
          failed: results.filter((r) => !r.success).length,
        },
      };
    } catch (error) {
      console.error('Error emptying trash:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new TaskService();
