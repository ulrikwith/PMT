import coreClient from './core.js';

class CommentService {
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
        html: html || text,
      };

      const result = await coreClient.query(mutation, { input });

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
        query GetComments($categoryId: String!) {
          commentList(categoryId: $categoryId, category: TODO, first: 50) {
            id
            text
            html
            createdAt
          }
        }
      `;

      const result = await coreClient.query(query, {
        categoryId: todoId,
      });

      if (!result.success) {
        return { success: true, data: [] }; // Return empty list on failure to avoid breaking callers
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

      const result = await coreClient.query(mutation, { id: commentId });
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new CommentService();
