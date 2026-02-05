import axios from 'axios';

const API_BASE_URL = '/api';

// Create configured axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for error handling and retries
// Use per-request retry tracking to avoid global state issues
const MAX_RETRIES = 2;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Initialize retry count on config if not present
    if (!config.__retryCount) {
      config.__retryCount = 0;
    }

    // Don't retry on 4xx client errors
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return Promise.reject(error);
    }

    // Retry on network errors or 5xx server errors
    if (config.__retryCount < MAX_RETRIES && (!error.response || error.response.status >= 500)) {
      config.__retryCount++;
      console.warn(
        `Retrying request (attempt ${config.__retryCount}/${MAX_RETRIES}):`,
        config.url,
        error.message
      );

      // Exponential backoff: 1s, 2s, 4s...
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, config.__retryCount - 1))
      );

      return axiosInstance(config);
    }

    // Enhanced error logging
    console.error('API Request Failed:', {
      url: config?.url,
      method: config?.method,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      retriesAttempted: config.__retryCount || 0,
    });

    return Promise.reject(error);
  }
);

const api = {
  // Health check
  getHealth: async () => {
    const response = await axiosInstance.get('/health');
    return response.data;
  },

  // Tasks
  getTasks: async (filters = {}) => {
    const response = await axiosInstance.get('/tasks', { params: filters });
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await axiosInstance.post('/tasks', taskData);
    return response.data;
  },

  updateTask: async (taskId, updates) => {
    const response = await axiosInstance.put(`/tasks/${taskId}`, updates);
    return response.data;
  },

  deleteTask: async (taskId, permanent = false) => {
    const response = await axiosInstance.delete(`/tasks/${taskId}`, {
      params: permanent ? { permanent: 'true' } : {},
    });
    return response.data;
  },

  // Trash
  getTrash: async () => {
    const response = await axiosInstance.get('/trash');
    return response.data;
  },

  restoreTask: async (taskId) => {
    const response = await axiosInstance.post(`/trash/${taskId}/restore`);
    return response.data;
  },

  emptyTrash: async (olderThanDays = null) => {
    const response = await axiosInstance.delete('/trash', {
      params: olderThanDays ? { olderThanDays } : {},
    });
    return response.data;
  },

  permanentlyDeleteTask: async (taskId) => {
    const response = await axiosInstance.delete(`/trash/${taskId}`);
    return response.data;
  },

  // Tags
  getTags: async () => {
    const response = await axiosInstance.get('/tags');
    return response.data;
  },

  createTag: async (tagData) => {
    const response = await axiosInstance.post('/tags', tagData);
    return response.data;
  },

  // Relationships
  getRelationships: async () => {
    const response = await axiosInstance.get('/relationships');
    return response.data;
  },

  createRelationship: async (relationshipData) => {
    const response = await axiosInstance.post('/relationships', relationshipData);
    return response.data;
  },

  getTaskRelationships: async (taskId) => {
    const response = await axiosInstance.get(`/tasks/${taskId}/relationships`);
    return response.data;
  },

  deleteRelationship: async (relationshipId) => {
    const response = await axiosInstance.delete(`/relationships/${relationshipId}`);
    return response.data;
  },

  // Launch
  getLaunchPhases: async () => {
    const response = await axiosInstance.get('/launch/phases');
    return response.data;
  },

  getMilestones: async () => {
    const response = await axiosInstance.get('/launch/milestones');
    return response.data;
  },

  getMilestoneTasks: async (milestoneId) => {
    const response = await axiosInstance.get(`/launch/milestones/${milestoneId}/tasks`);
    return response.data;
  },

  getMilestoneProgress: async (milestoneId) => {
    const response = await axiosInstance.get(`/launch/milestones/${milestoneId}/progress`);
    return response.data;
  },

  linkTaskToMilestone: async (taskId, milestoneId) => {
    const response = await axiosInstance.post(`/launch/milestones/${milestoneId}/link`, { taskId });
    return response.data;
  },

  exportData: async () => {
    // Trigger download directly
    window.location.href = `${API_BASE_URL}/export?format=json`;
  },

  // Workspaces
  getWorkspaces: async () => {
    const response = await axiosInstance.get('/workspaces');
    return response.data;
  },

  // Custom GraphQL query
  executeQuery: async (query, variables = {}) => {
    const response = await axiosInstance.post('/graphql', {
      query,
      variables,
    });
    return response.data;
  },

  // Vision
  getAllVisions: async () => {
    const response = await axiosInstance.get('/visions');
    return response.data;
  },

  saveVision: async (dimension, data, elementId = null) => {
    const response = await axiosInstance.put(`/visions/${dimension}`, {
      elementId,
      data,
    });
    return response.data;
  },

  deleteVision: async (dimension, elementId = null, type = null) => {
    const params = {};
    if (elementId) params.elementId = elementId;
    if (type) params.type = type;
    const response = await axiosInstance.delete(`/visions/${dimension}`, { params });
    return response.data;
  },

  // Reviews
  getReviews: async () => {
    const response = await axiosInstance.get('/reviews');
    return response.data;
  },

  saveReview: async (reviewData) => {
    const response = await axiosInstance.post('/reviews', reviewData);
    return response.data;
  },

  // Explorations
  getExplorations: async () => {
    const response = await axiosInstance.get('/explorations');
    return response.data;
  },

  saveExploration: async (explorationData) => {
    const response = await axiosInstance.post('/explorations', explorationData);
    return response.data;
  },

  updateExploration: async (id, explorationData) => {
    const response = await axiosInstance.put(`/explorations/${id}`, explorationData);
    return response.data;
  },

  deleteExploration: async (id) => {
    const response = await axiosInstance.delete(`/explorations/${id}`);
    return response.data;
  },
};

export default api;
