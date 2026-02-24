import coreClient from './core.js';
import tagsService from './tags.js';

class StickiesService {
  constructor() {
    this.stickyTag = 'PMT_STICKY';
  }

  async getAllStickies(todoListId) {
    try {
      todoListId = todoListId || (await coreClient.getDefaultTodoListId());

      const query = `
        query GetStickyTodos($todoListId: String!) {
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
        return { success: false, error: result.error || 'Failed to fetch stickies' };
      }

      const stickyTodos = result.data.todoList.todos.filter((todo) =>
        todo.tags.some((tag) => tag.title === this.stickyTag)
      );

      const stickies = stickyTodos
        .map((todo) => {
          try {
            const base64Data = todo.text.replace(/<[^>]*>/g, '').replace(/\s/g, '');
            const json = Buffer.from(base64Data, 'base64').toString('utf-8');
            return { blueId: todo.id, ...JSON.parse(json) };
          } catch (parseErr) {
            console.error(`Failed to parse sticky todo ${todo.id}:`, parseErr.message);
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

      return { success: true, data: stickies };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async saveSticky(todoListId, stickyData) {
    try {
      todoListId = todoListId || (await coreClient.getDefaultTodoListId());

      const jsonString = JSON.stringify(stickyData);
      const base64Data = Buffer.from(jsonString).toString('base64');

      const mutation = `
        mutation CreateStickyTodo($input: CreateTodoInput!) {
          createTodo(input: $input) {
            id
            title
            text
          }
        }
      `;

      const input = {
        todoListId,
        title: `PMT Sticky - ${stickyData.title || 'Untitled'}`,
        description: base64Data,
      };

      const result = await coreClient.query(mutation, { input });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to create sticky' };
      }

      const todoId = result.data.createTodo.id;

      // Set the text/html body via editTodo (CreateTodoInput only supports description)
      await coreClient.query(
        `mutation SetBody($input: EditTodoInput!) { editTodo(input: $input) { id } }`,
        { input: { todoId, html: base64Data } }
      );

      await tagsService.addTagToTask(todoId, this.stickyTag);

      return { success: true, data: { blueId: todoId, ...stickyData } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateSticky(todoListId, blueId, stickyData) {
    try {
      const jsonString = JSON.stringify(stickyData);
      const base64Data = Buffer.from(jsonString).toString('base64');

      const mutation = `
        mutation EditStickyTodo($input: EditTodoInput!) {
          editTodo(input: $input) {
            id
            text
          }
        }
      `;

      const input = {
        todoId: blueId,
        title: `PMT Sticky - ${stickyData.title || 'Untitled'}`,
        html: base64Data,
      };

      const result = await coreClient.query(mutation, { input });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to update sticky' };
      }

      return { success: true, data: { blueId, ...stickyData } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteSticky(todoListId, blueId) {
    try {
      const mutation = `
        mutation DeleteStickyTodo($input: DeleteTodoInput!) {
          deleteTodo(input: $input) {
            success
          }
        }
      `;

      const result = await coreClient.query(mutation, { input: { todoId: blueId } });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to delete sticky' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new StickiesService();
