import coreClient from './services/bluecc/core.js';
import taskService from './services/bluecc/tasks.js';
import tagService from './services/bluecc/tags.js';
import relationshipService from './services/bluecc/relationships.js';
import launchService from './services/bluecc/launch.js';
import commentService from './services/bluecc/comments.js';
import visionService from './services/bluecc/vision.js';
import reviewService from './services/bluecc/reviews.js';

// Facade to maintain original API surface
const blueClient = {
  // Core
  query: (q, v, o) => coreClient.query(q, v, o),
  testConnection: () => coreClient.testConnection(),
  ensureWorkspace: () => coreClient.ensureWorkspace(),
  getCompanyId: () => coreClient.getCompanyId(),
  getDefaultProjectId: () => coreClient.getDefaultProjectId(),
  getDefaultTodoListId: () => coreClient.getDefaultTodoListId(),
  getWorkspaces: () => coreClient.getWorkspaces(),
  executeQuery: (q, v) => coreClient.query(q, v),

  // Tasks
  getTasks: (f) => taskService.getTasks(f),
  createTask: (d) => taskService.createTask(d),
  updateTask: (id, u) => taskService.updateTask(id, u),
  deleteTask: (id, p) => taskService.deleteTask(id, p),
  restoreTask: (id) => taskService.restoreTask(id),
  getDeletedTasks: () => taskService.getDeletedTasks(),
  emptyTrash: (d) => taskService.emptyTrash(d),

  // Tags
  getTags: () => tagService.getTags(),
  createTag: (n, c) => tagService.createTag(n, c),
  addTagToTask: (id, n) => tagService.addTagToTask(id, n),

  // Relationships
  createTaskRelationship: (f, t, y, l) => relationshipService.createTaskRelationship(f, t, y, l),
  getAllRelationships: () => relationshipService.getAllRelationships(),
  getTaskRelationships: (id) => relationshipService.getTaskRelationships(id),
  deleteRelationship: (id) => relationshipService.deleteRelationship(id),

  // Comments
  createComment: (id, t, h) => commentService.createComment(id, t, h),
  getCommentsForTodo: (id) => commentService.getCommentsForTodo(id),
  deleteComment: (id) => commentService.deleteComment(id),

  // Launch/Milestones
  linkTaskToMilestone: (ti, mi) => launchService.linkTaskToMilestone(ti, mi),
  getTasksForMilestone: (id) => launchService.getTasksForMilestone(id),
  getMilestoneProgress: (id) => launchService.getMilestoneProgress(id),
  calculateReadiness: () => launchService.calculateReadiness(),

  // Vision
  getAllVisions: () => visionService.getAllVisions(),
  saveVision: (dim, data, elemId) => visionService.saveVision(dim, data, elemId),
  deleteVision: (dim, elemId, type) => visionService.deleteVision(dim, elemId, type),

  // Reviews
  getReviews: () => reviewService.getReviews(),
  saveReview: (data) => reviewService.saveReview(data),

  // Utils (exposed if needed)
  formatDate: (d) => coreClient.formatDate(d),
};

export default blueClient;
