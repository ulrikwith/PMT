import coreClient from './core.js';
import tagsService from './tags.js';

class ExplorationService {
  constructor() {
    this.explorationTag = 'PMT_EXPLORATION';
  }

  async getAllExplorations() {
    try {
      const todoListId = await coreClient.getDefaultTodoListId();

      const query = `
        query GetExplorationTodos($todoListId: String!) {
          todoList(id: $todoListId) {
            todos {
              id
              title
              text
              tags {
                id
                title
              }
              createdAt
              updatedAt
            }
          }
        }
      `;

      const result = await coreClient.query(query, { todoListId });

      if (!result.success || !result.data.todoList) {
        return { success: false, error: result.error || 'Failed to fetch explorations' };
      }

      const explorationTodos = result.data.todoList.todos.filter((todo) =>
        todo.tags.some((tag) => tag.title === this.explorationTag)
      );

      const explorations = explorationTodos
        .map((todo) => {
          try {
            const base64Data = todo.text.replace(/<[^>]*>/g, '').replace(/\s/g, '');
            const json = Buffer.from(base64Data, 'base64').toString('utf-8');
            return { blueId: todo.id, ...JSON.parse(json) };
          } catch (parseErr) {
            console.error(`Failed to parse exploration todo ${todo.id}:`, parseErr.message);
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

      return { success: true, data: explorations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async saveExploration(explorationData) {
    try {
      const todoListId = await coreClient.getDefaultTodoListId();

      // Strip binary data: URIs from reflection entries to reduce payload
      const cleanedData = this._stripBinaryData(explorationData);

      const jsonString = JSON.stringify(cleanedData);
      const base64Data = Buffer.from(jsonString).toString('base64');

      const mutation = `
        mutation CreateExplorationTodo($input: CreateTodoInput!) {
          createTodo(input: $input) {
            id
            title
            text
          }
        }
      `;

      const input = {
        todoListId,
        title: `PMT Exploration - ${explorationData.title || 'Untitled'}`,
        html: base64Data,
      };

      const result = await coreClient.query(mutation, { input });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to create exploration' };
      }

      const todoId = result.data.createTodo.id;
      await tagsService.addTagToTask(todoId, this.explorationTag);

      return { success: true, data: { blueId: todoId, ...explorationData } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateExploration(blueId, explorationData) {
    try {
      const cleanedData = this._stripBinaryData(explorationData);
      const jsonString = JSON.stringify(cleanedData);
      const base64Data = Buffer.from(jsonString).toString('base64');

      const mutation = `
        mutation EditExplorationTodo($input: EditTodoInput!) {
          editTodo(input: $input) {
            id
            text
          }
        }
      `;

      const input = {
        todoId: blueId,
        title: `PMT Exploration - ${explorationData.title || 'Untitled'}`,
        html: base64Data,
      };

      const result = await coreClient.query(mutation, { input });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to update exploration' };
      }

      return { success: true, data: { blueId, ...explorationData } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteExploration(blueId) {
    try {
      const mutation = `
        mutation DeleteExplorationTodo($input: DeleteTodoInput!) {
          deleteTodo(input: $input) {
            success
          }
        }
      `;

      const result = await coreClient.query(mutation, { input: { todoId: blueId } });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to delete exploration' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Strip large data: URIs from reflection entries to reduce payload size.
   * Binary media (images, audio, files) stored as data: URIs can be very large
   * and would cause issues with the Blue.cc API.
   */
  _stripBinaryData(data) {
    const cleaned = { ...data };

    if (Array.isArray(cleaned.reflectionEntries)) {
      cleaned.reflectionEntries = cleaned.reflectionEntries.map((entry) => {
        const cleanEntry = { ...entry };
        if (cleanEntry.imageUrl && cleanEntry.imageUrl.startsWith('data:')) {
          cleanEntry.imageUrl = '[binary-stripped]';
        }
        if (cleanEntry.audioUrl && cleanEntry.audioUrl.startsWith('data:')) {
          cleanEntry.audioUrl = '[binary-stripped]';
        }
        if (cleanEntry.fileUrl && cleanEntry.fileUrl.startsWith('data:')) {
          cleanEntry.fileUrl = '[binary-stripped]';
        }
        return cleanEntry;
      });
    }

    if (Array.isArray(cleaned.potentials)) {
      cleaned.potentials = cleaned.potentials.map((potential) => {
        const cleanPotential = { ...potential };
        if (cleanPotential.visualUrl && cleanPotential.visualUrl.startsWith('data:')) {
          cleanPotential.visualUrl = '[binary-stripped]';
        }
        return cleanPotential;
      });
    }

    return cleaned;
  }
}

export default new ExplorationService();
