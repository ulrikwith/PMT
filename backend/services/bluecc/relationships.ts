import taskService from './tasks.js';
import crypto from 'crypto';
import type {
  Task,
  Relationship,
  ApiResponse,
  RelationshipServiceInterface,
} from '../../types/index.js';

class RelationshipService implements RelationshipServiceInterface {
  /**
   * Generate a cryptographically secure unique relationship ID
   * @returns Unique relationship ID in format: rel-{timestamp}-{randomhex}
   */
  generateRelationshipId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(8).toString('hex');
    return `rel-${timestamp}-${randomBytes}`;
  }

  /**
   * Check if creating a relationship would create a circular dependency
   * Uses Breadth-First Search (BFS) to detect cycles
   * @param fromTaskId - Source task ID
   * @param toTaskId - Target task ID
   * @param allTasks - All tasks in the system
   * @returns True if circular dependency would be created
   */
  async detectCircularDependency(
    fromTaskId: string,
    toTaskId: string,
    allTasks: Task[]
  ): Promise<boolean> {
    const visited = new Set<string>();
    const queue: string[] = [toTaskId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;

      if (currentId === fromTaskId) {
        return true; // Circular dependency detected
      }

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);

      // Find all relationships from currentId
      const currentTask = allTasks.find((t) => t.id === currentId);
      if (currentTask?.relationships) {
        for (const rel of currentTask.relationships) {
          queue.push(rel.toTaskId);
        }
      }
    }

    return false; // No circular dependency
  }

  /**
   * Create a new task relationship
   * @param fromTaskId - Source task ID
   * @param toTaskId - Target task ID
   * @param type - Relationship type (e.g., 'blocks', 'depends-on')
   * @param label - Optional label for the relationship
   * @returns API response with created relationship or error
   */
  async createTaskRelationship(
    fromTaskId: string,
    toTaskId: string,
    type: string,
    label: string | null = null
  ): Promise<ApiResponse<Relationship>> {
    try {
      // Validate inputs
      if (!fromTaskId || !toTaskId || !type) {
        return { success: false, error: 'Missing required fields: fromTaskId, toTaskId, or type' };
      }

      // Prevent self-referencing
      if (fromTaskId === toTaskId) {
        return { success: false, error: 'Cannot create relationship to self' };
      }

      // 1. Get current tasks
      const tasksRes = await taskService.getTasks();
      if (!tasksRes.success) {
        return { success: false, error: tasksRes.error };
      }

      const tasks = tasksRes.data as Task[];
      const fromTask = tasks.find((t) => t.id === fromTaskId);
      if (!fromTask) {
        return { success: false, error: 'Source task not found' };
      }

      const toTask = tasks.find((t) => t.id === toTaskId);
      if (!toTask) {
        return { success: false, error: 'Target task not found' };
      }

      // Check for circular dependencies
      const wouldCreateCycle = await this.detectCircularDependency(fromTaskId, toTaskId, tasks);
      if (wouldCreateCycle) {
        return {
          success: false,
          error: 'Cannot create relationship: would create circular dependency',
        };
      }

      const relId = this.generateRelationshipId();
      const newRel: Relationship = {
        id: relId,
        fromTaskId,
        toTaskId,
        type,
        label,
        createdAt: new Date().toISOString(),
      };

      // 2. Add relationship to array
      const currentRels = fromTask.relationships || [];
      const updatedRels = [...currentRels, newRel];

      // 3. Update task
      const updateRes = await taskService.updateTask(fromTaskId, { relationships: updatedRels });
      if (!updateRes.success) {
        return { success: false, error: updateRes.error };
      }

      return { success: true, data: newRel };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }

  /**
   * Get all relationships across all tasks
   * @returns API response with array of all relationships
   */
  async getAllRelationships(): Promise<ApiResponse<Relationship[]>> {
    try {
      const tasksResult = await taskService.getTasks();
      if (!tasksResult.success) {
        return { success: false, error: tasksResult.error };
      }

      const tasks = tasksResult.data as Task[];
      const relationships: Relationship[] = [];

      for (const task of tasks) {
        if (task.relationships && Array.isArray(task.relationships)) {
          relationships.push(...task.relationships);
        }
      }

      return { success: true, data: relationships };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }

  /**
   * Get all relationships for a specific task (both incoming and outgoing)
   * @param taskId - Task ID to get relationships for
   * @returns API response with filtered relationships
   */
  async getTaskRelationships(taskId: string): Promise<ApiResponse<Relationship[]>> {
    try {
      const allRels = await this.getAllRelationships();
      if (!allRels.success) {
        return allRels;
      }

      const filtered = allRels.data!.filter(
        (r) => r.fromTaskId === taskId || r.toTaskId === taskId
      );

      return { success: true, data: filtered };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }

  /**
   * Delete a relationship by ID
   * @param relationshipId - Relationship ID to delete
   * @returns API response indicating success or error
   */
  async deleteRelationship(relationshipId: string): Promise<ApiResponse<void>> {
    try {
      const tasksResult = await taskService.getTasks();
      if (!tasksResult.success) {
        return { success: false, error: tasksResult.error };
      }

      const tasks = tasksResult.data as Task[];
      let targetTask: Task | null = null;
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
      const updatedRels = [...targetTask.relationships!];
      updatedRels.splice(relIndex, 1);

      const updateRes = await taskService.updateTask(targetTask.id, { relationships: updatedRels });
      if (!updateRes.success) {
        return { success: false, error: updateRes.error };
      }

      return { success: true };
    } catch (error) {
      const err = error as Error;
      return { success: false, error: err.message };
    }
  }
}

export default new RelationshipService();
