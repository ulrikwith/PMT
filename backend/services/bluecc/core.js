import { GraphQLClient } from 'graphql-request';
import dotenv from 'dotenv';

dotenv.config();

const BLUE_API_ENDPOINT = 'https://api.blue.cc/graphql';

class CoreClient {
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

  /**
   * Create a new TodoList in the default project.
   * Used for user provisioning — each user gets their own TodoList.
   *
   * @param {string} title     - TodoList title (e.g. "pmt_user_alice@email.com")
   * @param {string|null} projectId - Optional project ID override
   * @returns {string|null} The created TodoList ID, or null on failure
   */
  async createTodoList(title, projectId = null) {
    const pid = projectId || (await this.getDefaultProjectId());

    const mutation = `
      mutation CreateList($input: CreateTodoListInput!) {
        createTodoList(input: $input) {
          id
        }
      }
    `;

    const result = await this.query(mutation, {
      input: { projectId: pid, title },
    });

    if (result.success) {
      return result.data.createTodoList.id;
    }

    console.error('Failed to create TodoList:', result.error);
    return null;
  }

  async getWorkspaces() {
    try {
      const id = await this.getCompanyId();
      return { success: true, data: [{ id, name: 'Blue.cc Workspace' }] };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  formatDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr.includes('T')) return dateStr;
    return `${dateStr}T09:00:00.000Z`;
  }
}

export default new CoreClient();
