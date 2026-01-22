import axios from 'axios';

const API_BASE_URL = '/api';

const api = {
  // Health check
  getHealth: async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  },

  // Tasks
  getTasks: async (filters = {}) => {
    const response = await axios.get(`${API_BASE_URL}/tasks`, { params: filters });
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await axios.post(`${API_BASE_URL}/tasks`, taskData);
    return response.data;
  },

  updateTask: async (taskId, updates) => {
    const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}`, updates);
    return response.data;
  },

  deleteTask: async (taskId, permanent = false) => {
    const response = await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, {
      params: permanent ? { permanent: 'true' } : {}
    });
    return response.data;
  },

  // Trash
  getTrash: async () => {
    const response = await axios.get(`${API_BASE_URL}/trash`);
    return response.data;
  },

  restoreTask: async (taskId) => {
    const response = await axios.post(`${API_BASE_URL}/trash/${taskId}/restore`);
    return response.data;
  },

  emptyTrash: async (olderThanDays = null) => {
    const response = await axios.delete(`${API_BASE_URL}/trash`, {
      params: olderThanDays ? { olderThanDays } : {}
    });
    return response.data;
  },

  permanentlyDeleteTask: async (taskId) => {
    const response = await axios.delete(`${API_BASE_URL}/trash/${taskId}`);
    return response.data;
  },

  // Tags
  getTags: async () => {
    const response = await axios.get(`${API_BASE_URL}/tags`);
    return response.data;
  },

  createTag: async (tagData) => {
    const response = await axios.post(`${API_BASE_URL}/tags`, tagData);
    return response.data;
  },

  // Relationships
  getRelationships: async () => {
    const response = await axios.get(`${API_BASE_URL}/relationships`);
    return response.data;
  },

  createRelationship: async (relationshipData) => {
    const response = await axios.post(`${API_BASE_URL}/relationships`, relationshipData);
    return response.data;
  },

  getTaskRelationships: async (taskId) => {
    const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}/relationships`);
    return response.data;
  },

  deleteRelationship: async (relationshipId) => {
    const response = await axios.delete(`${API_BASE_URL}/relationships/${relationshipId}`);
    return response.data;
  },

  // Launch
  getLaunchPhases: async () => {
    const response = await axios.get(`${API_BASE_URL}/launch/phases`);
    return response.data;
  },

  getMilestones: async () => {
    const response = await axios.get(`${API_BASE_URL}/launch/milestones`);
    return response.data;
  },

  getMilestoneTasks: async (milestoneId) => {
    const response = await axios.get(`${API_BASE_URL}/launch/milestones/${milestoneId}/tasks`);
    return response.data;
  },

  getMilestoneProgress: async (milestoneId) => {
    const response = await axios.get(`${API_BASE_URL}/launch/milestones/${milestoneId}/progress`);
    return response.data;
  },

  linkTaskToMilestone: async (taskId, milestoneId) => {
    const response = await axios.post(`${API_BASE_URL}/launch/milestones/${milestoneId}/link`, { taskId });
    return response.data;
  },

  getReadiness: async () => {
    const response = await axios.get(`${API_BASE_URL}/launch/readiness`);
    return response.data;
  },

  exportData: async () => {
      // Trigger download directly
      window.location.href = `${API_BASE_URL}/export?format=json`;
  },

  // Workspaces
  getWorkspaces: async () => {
    const response = await axios.get(`${API_BASE_URL}/workspaces`);
    return response.data;
  },

  // Custom GraphQL query
  executeQuery: async (query, variables = {}) => {
    const response = await axios.post(`${API_BASE_URL}/graphql`, {
      query,
      variables,
    });
    return response.data;
  },
};

export default api;
