import coreClient from './core.js';

export const DIMENSION_TAGS = {
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
  ADMIN_OTHER: { name: 'admin-other', color: '#C4B5FD' },
};

class TagService {
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

      const result = await coreClient.query(query);

      if (!result.success) {
        return { success: true, data: Object.values(DIMENSION_TAGS) };
      }

      return {
        success: true,
        data: result.data.tags.map((t) => ({
          name: t.title,
          color: t.color,
          id: t.id,
        })),
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

      const result = await coreClient.query(mutation, {
        input: { title: name, color: color || '#888888' },
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        data: {
          id: result.data.createTag.id,
          name: result.data.createTag.title,
          color: result.data.createTag.color,
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async addTagToTask(taskId, tagName) {
    try {
      const tagsResult = await this.getTags();
      let tagId = null;

      if (tagsResult.success) {
        const existingTag = tagsResult.data.find((t) => t.name === tagName);
        if (existingTag) {
          tagId = existingTag.id;
        }
      }

      if (!tagId) {
        const dimensionTag = Object.values(DIMENSION_TAGS).find((t) => t.name === tagName);
        const color = dimensionTag ? dimensionTag.color : '#888888';

        const createResult = await this.createTag(tagName, color);
        if (createResult.success) {
          tagId = createResult.data.id;
        } else {
          return { success: false, error: 'Failed to create tag' };
        }
      }

      const todoQuery = `query GetTodoTags($id: String!) { todo(id: $id) { tags { id } } }`;
      const todoResult = await coreClient.query(todoQuery, { id: taskId });

      let currentTagIds = [];
      if (todoResult.success && todoResult.data.todo && todoResult.data.todo.tags) {
        currentTagIds = todoResult.data.todo.tags.map((t) => t.id);
      }

      if (currentTagIds.includes(tagId)) {
        return { success: true, data: { message: 'Tag already added' } };
      }

      const mutation = `
        mutation SetTodoTags($input: SetTodoTagsInput!) {
          setTodoTags(input: $input)
        }
      `;

      const result = await coreClient.query(mutation, {
        input: { todoId: taskId, tagIds: [...currentTagIds, tagId] },
      });

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new TagService();
