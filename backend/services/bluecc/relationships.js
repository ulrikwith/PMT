import taskService from './tasks.js';
import crypto from 'crypto';

class RelationshipService {
  /**
   * Generate a cryptographically secure unique relationship ID
   */
  generateRelationshipId() {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `rel-${timestamp}-${randomBytes}`;
  }

  /**
   * Check if creating a relationship would create a circular dependency
   */
  async detectCircularDependency(fromTaskId, toTaskId, allTasks) {
    const visited = new Set();
    const queue = [toTaskId];

    while (queue.length > 0) {
      const currentId = queue.shift();

      if (currentId === fromTaskId) {
        return true; // Circular dependency detected
      }

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);

      // Find all relationships from currentId
      const currentTask = allTasks.find((t) => t.id === currentId);
      if (currentTask && currentTask.relationships) {
        for (const rel of currentTask.relationships) {
          queue.push(rel.toTaskId);
        }
      }
    }

    return false; // No circular dependency
  }

  async createTaskRelationship(fromTaskId, toTaskId, type, label = null) {
    try {
      // Validate inputs
      if (!fromTaskId || !toTaskId || !type) {
        return { success: false, error: 'Missing required fields: fromTaskId, toTaskId, or type' };
      }

      // Prevent self-referencing
      if (fromTaskId === toTaskId) {
        return { success: false, error: 'Cannot create relationship to self' };
      }

      // 1. Get current task
      const tasksRes = await taskService.getTasks();
      if (!tasksRes.success) return { success: false, error: tasksRes.error };

      const tasks = tasksRes.data;
      const fromTask = tasks.find((t) => t.id === fromTaskId);
      if (!fromTask) return { success: false, error: 'Source task not found' };

      const toTask = tasks.find((t) => t.id === toTaskId);
      if (!toTask) return { success: false, error: 'Target task not found' };

      // Check for circular dependencies
      const wouldCreateCycle = await this.detectCircularDependency(fromTaskId, toTaskId, tasks);
      if (wouldCreateCycle) {
        return {
          success: false,
          error: 'Cannot create relationship: would create circular dependency',
        };
      }

      const relId = this.generateRelationshipId();
      const newRel = {
        id: relId,
        fromTaskId,
        toTaskId,
        type,
        label,
        createdAt: new Date().toISOString(),
      };

      // 2. Add relationship to array
      // Note: getTasks now parses from custom fields, so 'relationships' property is accurate
      const currentRels = fromTask.relationships || [];
      const updatedRels = [...currentRels, newRel];

      // 3. Update task (taskService.updateTask now writes to custom fields)
      const updateRes = await taskService.updateTask(fromTaskId, { relationships: updatedRels });
      if (!updateRes.success) return { success: false, error: updateRes.error };

      return { success: true, data: newRel };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAllRelationships() {
    try {
      const tasksResult = await taskService.getTasks();
      if (!tasksResult.success) {
        return { success: false, error: tasksResult.error };
      }

      const tasks = tasksResult.data;
      const relationships = [];

      for (const task of tasks) {
        if (task.relationships && Array.isArray(task.relationships)) {
          relationships.push(...task.relationships);
        }
      }

      return { success: true, data: relationships };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTaskRelationships(taskId) {
    try {
      const allRels = await this.getAllRelationships();
      if (!allRels.success) {
        return allRels;
      }

      const filtered = allRels.data.filter((r) => r.fromTaskId === taskId || r.toTaskId === taskId);

      return { success: true, data: filtered };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteRelationship(relationshipId) {
    try {
      const tasksResult = await taskService.getTasks();
      if (!tasksResult.success) return { success: false, error: tasksResult.error };

      const tasks = tasksResult.data;
      let targetTask = null;
      let relIndex = -1;

      // Find the task that holds this relationship
      for (const task of tasks) {
        if (task.relationships) {
          relIndex = task.relationships.findIndex((r) => r.id === relationshipId);
          if (relIndex !== -1) {
            targetTask = task;
            break;
          }
        }
      }

      if (!targetTask) {
        return { success: false, error: 'Relationship not found' };
      }

      // Remove it
      const updatedRels = [...targetTask.relationships];
      updatedRels.splice(relIndex, 1);

      const updateRes = await taskService.updateTask(targetTask.id, { relationships: updatedRels });
      if (!updateRes.success) return { success: false, error: updateRes.error };

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new RelationshipService();
