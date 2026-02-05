import coreClient from './services/bluecc/core.js';
import taskService from './services/bluecc/tasks.js';
import tagService from './services/bluecc/tags.js';
import relationshipService from './services/bluecc/relationships.js';
import launchService from './services/bluecc/launch.js';
import visionService from './services/bluecc/vision.js';
import reviewService from './services/bluecc/reviews.js';
import explorationService from './services/bluecc/exploration.js';

// Facade to maintain original API surface
// Sprint 2: todoListId is now the first parameter for all data-access methods
const blueClient = {
  // Core (no todoListId needed — infrastructure methods)
  query: (q, v, o) => coreClient.query(q, v, o),
  testConnection: () => coreClient.testConnection(),
  ensureWorkspace: () => coreClient.ensureWorkspace(),
  getCompanyId: () => coreClient.getCompanyId(),
  getDefaultProjectId: () => coreClient.getDefaultProjectId(),
  getDefaultTodoListId: () => coreClient.getDefaultTodoListId(),
  getWorkspaces: () => coreClient.getWorkspaces(),
  executeQuery: (q, v) => coreClient.query(q, v),

  // Tasks
  getTasks: (todoListId, f) => taskService.getTasks(todoListId, f),
  createTask: (todoListId, d) => taskService.createTask(todoListId, d),
  updateTask: (todoListId, id, u) => taskService.updateTask(todoListId, id, u),
  deleteTask: (todoListId, id, p) => taskService.deleteTask(todoListId, id, p),
  restoreTask: (todoListId, id) => taskService.restoreTask(todoListId, id),
  getDeletedTasks: (todoListId) => taskService.getDeletedTasks(todoListId),
  emptyTrash: (todoListId, d) => taskService.emptyTrash(todoListId, d),

  // Tags (global — not scoped to todoListId)
  getTags: () => tagService.getTags(),
  createTag: (n, c) => tagService.createTag(n, c),
  addTagToTask: (id, n) => tagService.addTagToTask(id, n),

  // Relationships
  createTaskRelationship: (todoListId, f, t, y, l) => relationshipService.createTaskRelationship(todoListId, f, t, y, l),
  getAllRelationships: (todoListId) => relationshipService.getAllRelationships(todoListId),
  getTaskRelationships: (todoListId, id) => relationshipService.getTaskRelationships(todoListId, id),
  deleteRelationship: (todoListId, id) => relationshipService.deleteRelationship(todoListId, id),

  // Launch/Milestones
  linkTaskToMilestone: (todoListId, ti, mi) => launchService.linkTaskToMilestone(todoListId, ti, mi),
  getTasksForMilestone: (todoListId, id) => launchService.getTasksForMilestone(todoListId, id),
  getMilestoneProgress: (todoListId, id) => launchService.getMilestoneProgress(todoListId, id),
  calculateReadiness: (todoListId) => launchService.calculateReadiness(todoListId),

  // Vision
  getAllVisions: (todoListId) => visionService.getAllVisions(todoListId),
  saveVision: (todoListId, dim, data, elemId) => visionService.saveVision(todoListId, dim, data, elemId),
  deleteVision: (todoListId, dim, elemId, type) => visionService.deleteVision(todoListId, dim, elemId, type),

  // Reviews
  getReviews: (todoListId) => reviewService.getReviews(todoListId),
  saveReview: (todoListId, data) => reviewService.saveReview(todoListId, data),

  // Explorations
  getAllExplorations: (todoListId) => explorationService.getAllExplorations(todoListId),
  saveExploration: (todoListId, data) => explorationService.saveExploration(todoListId, data),
  updateExploration: (todoListId, id, data) => explorationService.updateExploration(todoListId, id, data),
  deleteExploration: (todoListId, id) => explorationService.deleteExploration(todoListId, id),

  // Utils (exposed if needed)
  formatDate: (d) => coreClient.formatDate(d),
};

export default blueClient;
