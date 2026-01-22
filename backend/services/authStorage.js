import blueClient from './blueClient.js';
import coreClient from './services/bluecc/core.js';

// Configuration
const USERS_LIST_TITLE = 'PMT_SYSTEM_USERS';

class AuthService {
  constructor() {
    this.usersListId = null;
  }

  // Ensure the "PMT_SYSTEM_USERS" list exists
  async ensureUsersList() {
    if (this.usersListId) return this.usersListId;

    const projectId = await coreClient.getDefaultProjectId();
    
    // 1. Get Lists
    const q = `query GetLists($projectId: String!) { todoLists(projectId: $projectId) { id title } }`;
    const res = await coreClient.query(q, { projectId });
    
    if (res.success) {
      const list = res.data.todoLists.find(l => l.title === USERS_LIST_TITLE);
      if (list) {
        this.usersListId = list.id;
        return list.id;
      }
    }

    // 2. Create if missing
    const m = `mutation CreateList($input: CreateTodoListInput!) { createTodoList(input: $input) { id } }`;
    const createRes = await coreClient.query(m, { input: { projectId, title: USERS_LIST_TITLE } });
    
    if (createRes.success) {
      this.usersListId = createRes.data.createTodoList.id;
      return this.usersListId;
    }
    
    throw new Error('Failed to initialize User Store in Blue.cc');
  }

  // Find user by email (Task Title = Email)
  async findUserByEmail(email) {
    const listId = await this.ensureUsersList();
    
    const q = `query GetUsers($listId: String!) { todoList(id: $listId) { todos { id title text } } }`;
    const res = await coreClient.query(q, { listId });
    
    if (res.success) {
      const userTask = res.data.todoList.todos.find(t => t.title.toLowerCase() === email.toLowerCase());
      if (userTask) {
        // Parse metadata from description (where we store password hash)
        return this._parseUserTask(userTask);
      }
    }
    return null;
  }

  // Create new user
  async createUser(email, passwordHash, googleId = null, name = '') {
    const listId = await this.ensureUsersList();
    
    const userData = {
      hash: passwordHash,
      gid: googleId,
      name: name,
      created: new Date().toISOString()
    };

    // Store secure data in description as Base64 JSON
    const description = `---PMT-USER-DATA---\n${Buffer.from(JSON.stringify(userData)).toString('base64')}`;

    const m = `mutation CreateUser($input: CreateTodoInput!) { createTodo(input: $input) { id } }`;
    const res = await coreClient.query(m, { 
      input: { 
        todoListId: listId, 
        title: email, 
        description: description 
      } 
    });

    if (res.success) {
      return { id: res.data.createTodo.id, email, ...userData };
    }
    throw new Error('Failed to create user');
  }

  _parseUserTask(task) {
    try {
      const marker = '---PMT-USER-DATA---';
      if (task.text && task.text.includes(marker)) {
        const parts = task.text.split(marker);
        const b64 = parts[1].trim();
        const data = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
        return {
          id: task.id,
          email: task.title,
          ...data
        };
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
    return null;
  }
}

export default new AuthService();
