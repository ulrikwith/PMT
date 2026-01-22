import taskService from './tasks.js';

class RelationshipService {
  async createTaskRelationship(fromTaskId, toTaskId, type, label = null) {
    try {
      const relId = `rel-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newRel = {
        id: relId,
        fromTaskId,
        toTaskId,
        type,
        label,
        createdAt: new Date().toISOString()
      };

      // 1. Get current task
      const tasksRes = await taskService.getTasks();
      if (!tasksRes.success) return { success: false, error: tasksRes.error };
      
      const fromTask = tasksRes.data.find(t => t.id === fromTaskId);
      if (!fromTask) return { success: false, error: 'Source task not found' };

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

      const filtered = allRels.data.filter(
        r => r.fromTaskId === taskId || r.toTaskId === taskId
      );

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
          relIndex = task.relationships.findIndex(r => r.id === relationshipId);
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
