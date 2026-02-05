import coreClient from './core.js';
import tagsService from './tags.js';

/**
 * Vision Service
 * Stores vision data in blue.cc using a dedicated todo list approach
 * Each vision item is stored as a todo with special tags
 */
class VisionService {
  constructor() {
    this.visionTag = 'PMT_VISION';
  }

  /**
   * Get all vision data for a user
   * Returns structured vision data by dimension and element
   */
  async getAllVisions() {
    try {
      const todoListId = await coreClient.getDefaultTodoListId();

      const query = `
        query GetVisionTodos($todoListId: String!) {
          todoList(id: $todoListId) {
            todos {
              id
              title
              text
              tags {
                id
                title
              }
              customFields {
                id
                name
                value
              }
              createdAt
              updatedAt
            }
          }
        }
      `;

      const result = await coreClient.query(query, { todoListId });

      if (!result.success || !result.data.todoList) {
        return { success: false, error: result.error || 'Failed to fetch visions' };
      }

      // Filter only vision todos
      const visionTodos = result.data.todoList.todos.filter((todo) =>
        todo.tags.some((tag) => tag.title === this.visionTag)
      );

      // Parse into structured format
      const visions = {};

      visionTodos.forEach((todo) => {
        const parsed = this._parseTodoToVision(todo);
        if (parsed) {
          const { dimension, elementId, type } = parsed;

          if (!visions[dimension]) {
            visions[dimension] = {
              overall: '',
              elements: {},
            };
          }

          if (elementId) {
            // Element-level vision (inner/outer goals)
            if (!visions[dimension].elements[elementId]) {
              visions[dimension].elements[elementId] = {
                innerGoals: '',
                outerGoals: '',
              };
            }
            visions[dimension].elements[elementId][type] = todo.text;
          } else {
            // Overall dimension vision
            visions[dimension].overall = todo.text;
          }
        }
      });

      return { success: true, data: visions };
    } catch (error) {
      console.error('Error fetching visions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save or update a vision entry
   */
  async saveVision(dimension, data, elementId = null) {
    try {
      const todoListId = await coreClient.getDefaultTodoListId();

      if (!elementId) {
        // Save overall vision
        return await this._saveOverallVision(dimension, data.overall, todoListId);
      } else {
        // Save element vision (inner and outer goals)
        const results = await Promise.all([
          data.innerGoals !== undefined
            ? this._saveElementVision(
                dimension,
                elementId,
                'innerGoals',
                data.innerGoals,
                todoListId
              )
            : Promise.resolve({ success: true }),
          data.outerGoals !== undefined
            ? this._saveElementVision(
                dimension,
                elementId,
                'outerGoals',
                data.outerGoals,
                todoListId
              )
            : Promise.resolve({ success: true }),
        ]);

        const failed = results.find((r) => !r.success);
        if (failed) {
          return failed;
        }

        return { success: true, data: { dimension, elementId, ...data } };
      }
    } catch (error) {
      console.error('Error saving vision:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a vision entry
   */
  async deleteVision(dimension, elementId = null, type = null) {
    try {
      const todoListId = await coreClient.getDefaultTodoListId();
      const todos = await this._findVisionTodos(dimension, elementId, type, todoListId);

      if (todos.length === 0) {
        return { success: true }; // Nothing to delete
      }

      // Delete all matching todos
      const deletePromises = todos.map((todo) => this._deleteTodo(todo.id));
      await Promise.all(deletePromises);

      return { success: true };
    } catch (error) {
      console.error('Error deleting vision:', error);
      return { success: false, error: error.message };
    }
  }

  // Private helper methods

  async _saveOverallVision(dimension, text, todoListId) {
    const title = `vision_${dimension}_overall`;
    const existing = await this._findVisionTodos(dimension, null, null, todoListId);

    if (existing.length > 0) {
      // Update existing
      return await this._updateTodo(existing[0].id, text);
    } else {
      // Create new
      return await this._createVisionTodo(title, text, [this.visionTag, dimension]);
    }
  }

  async _saveElementVision(dimension, elementId, type, text, todoListId) {
    const title = `vision_${dimension}_${elementId}_${type}`;
    const existing = await this._findVisionTodos(dimension, elementId, type, todoListId);

    if (existing.length > 0) {
      // Update existing
      return await this._updateTodo(existing[0].id, text);
    } else {
      // Create new
      return await this._createVisionTodo(title, text, [
        this.visionTag,
        dimension,
        elementId,
        type,
      ]);
    }
  }

  async _findVisionTodos(dimension, elementId = null, type = null, todoListId) {
    const query = `
      query GetVisionTodos($todoListId: String!) {
        todoList(id: $todoListId) {
          todos {
            id
            title
            text
            tags {
              id
              title
            }
          }
        }
      }
    `;

    const result = await coreClient.query(query, { todoListId });

    if (!result.success || !result.data.todoList) {
      return [];
    }

    // Filter by matching criteria
    return result.data.todoList.todos.filter((todo) => {
      const tags = todo.tags.map((t) => t.title);

      // Must have PMT_VISION tag
      if (!tags.includes(this.visionTag)) return false;

      // Must match dimension
      if (!tags.includes(dimension)) return false;

      // If elementId specified, must match
      if (elementId && !tags.includes(elementId)) return false;

      // If type specified, must match
      if (type && !tags.includes(type)) return false;

      return true;
    });
  }

  async _createVisionTodo(title, text, tagNames) {
    const todoListId = await coreClient.getDefaultTodoListId();

    // Get or create all tags
    const tagIds = await Promise.all(tagNames.map((name) => this._getOrCreateTag(name)));

    const mutation = `
      mutation CreateVisionTodo($input: CreateTodoInput!) {
        createTodo(input: $input) {
          id
          title
          text
        }
      }
    `;

    const input = {
      title,
      description: text, // blue.cc uses 'description' not 'text'
      todoListId,
    };

    const result = await coreClient.query(mutation, { input });

    // After creating, add tags
    if (result.success && tagIds.length > 0) {
      const setTagsMutation = `
        mutation SetTodoTags($input: SetTodoTagsInput!) {
          setTodoTags(input: $input)
        }
      `;

      await coreClient.query(setTagsMutation, {
        input: {
          todoId: result.data.createTodo.id,
          tagIds: tagIds.filter(Boolean),
        },
      });
    }

    return result;
  }

  async _updateTodo(todoId, text) {
    const mutation = `
      mutation EditVisionTodo($input: EditTodoInput!) {
        editTodo(input: $input) {
          id
          text
        }
      }
    `;

    const input = {
      todoId,
      html: text,
    };

    return await coreClient.query(mutation, { input });
  }

  async _deleteTodo(todoId) {
    const mutation = `
      mutation DeleteVisionTodo($input: DeleteTodoInput!) {
        deleteTodo(input: $input) {
          success
        }
      }
    `;

    return await coreClient.query(mutation, { input: { todoId } });
  }

  async _getOrCreateTag(name) {
    // Get existing tags
    const tagsResult = await tagsService.getTags();

    if (tagsResult.success) {
      const existing = tagsResult.data.find((t) => t.name === name);
      if (existing) {
        return existing.id;
      }
    }

    // Create new tag
    const createResult = await tagsService.createTag(name, '#888888');
    if (createResult.success) {
      return createResult.data.id;
    }

    return null;
  }

  _parseTodoToVision(todo) {
    // Title format: vision_{dimension}_{elementId?}_{type?}
    const match = todo.title.match(/^vision_([^_]+)(?:_([^_]+))?(?:_([^_]+))?$/);
    if (!match) return null;

    const [, dimension, elementId, type] = match;

    return {
      dimension,
      elementId: elementId === 'overall' ? null : elementId,
      type: type || 'overall',
      text: todo.text,
    };
  }
}

export default new VisionService();
