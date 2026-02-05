import coreClient from './core.js';
import tagsService from './tags.js';

class ReviewService {
  constructor() {
    this.reviewTag = 'PMT_REVIEW';
  }

  async getReviews() {
    try {
      const todoListId = await coreClient.getDefaultTodoListId();

      const query = `
        query GetReviewTodos($todoListId: String!) {
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
        return { success: false, error: result.error || 'Failed to fetch reviews' };
      }

      const reviewTodos = result.data.todoList.todos.filter((todo) =>
        todo.tags.some((tag) => tag.title === this.reviewTag)
      );

      const reviews = reviewTodos
        .map((todo) => {
          try {
            const base64Data = todo.text.replace(/<[^>]*>/g, '').replace(/\s/g, '');
            const json = Buffer.from(base64Data, 'base64').toString('utf-8');
            return { id: todo.id, ...JSON.parse(json) };
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return { success: true, data: reviews };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async saveReview(reviewData) {
    try {
      const todoListId = await coreClient.getDefaultTodoListId();

      // Encode review as Base64 JSON
      const jsonString = JSON.stringify(reviewData);
      const base64Data = Buffer.from(jsonString).toString('base64');

      // Create a todo with the review tag
      const dateStr = new Date(reviewData.date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });

      const mutation = `
        mutation CreateReviewTodo($input: CreateTodoInput!) {
          createTodo(input: $input) {
            id
            title
            text
          }
        }
      `;

      const input = {
        todoListId,
        title: `AFII Review - ${dateStr}`,
        html: base64Data,
      };

      const result = await coreClient.query(mutation, { input });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to create review' };
      }

      // Tag it as a review
      const todoId = result.data.createTodo.id;
      await tagsService.addTagToTask(todoId, this.reviewTag);

      return { success: true, data: { id: todoId, ...reviewData } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new ReviewService();
