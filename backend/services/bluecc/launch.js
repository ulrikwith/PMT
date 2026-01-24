import taskService from './tasks.js';

class LaunchService {
  async linkTaskToMilestone(taskId, milestoneId) {
    try {
      // 1. Get task
      const tasksRes = await taskService.getTasks();
      if (!tasksRes.success) return { success: false, error: tasksRes.error };

      const task = tasksRes.data.find((t) => t.id === taskId);
      if (!task) return { success: false, error: 'Task not found' };

      // 2. Add milestone if not exists
      // Note: getTasks parses from CF, so we trust 'milestones'
      const currentMilestones = task.milestones || [];
      if (currentMilestones.includes(milestoneId)) {
        return { success: true, data: { taskId, milestoneId, alreadyLinked: true } };
      }

      const updatedMilestones = [...currentMilestones, milestoneId];

      // 3. Update task (taskService.updateTask handles CF update)
      const updateRes = await taskService.updateTask(taskId, { milestones: updatedMilestones });
      if (!updateRes.success) return { success: false, error: updateRes.error };

      return {
        success: true,
        data: {
          taskId,
          milestoneId,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getTasksForMilestone(milestoneId) {
    try {
      const tasksResult = await taskService.getTasks();
      if (!tasksResult.success) {
        return { success: false, error: tasksResult.error };
      }

      const tasks = tasksResult.data;
      const linkedTasks = tasks.filter((t) => t.milestones && t.milestones.includes(milestoneId));

      return { success: true, data: linkedTasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getMilestoneProgress(milestoneId) {
    const result = await this.getTasksForMilestone(milestoneId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    const tasks = result.data;
    if (tasks.length === 0) {
      return { success: true, data: { progress: 0, total: 0, completed: 0 } };
    }

    const completed = tasks.filter((t) => t.status === 'Done').length;
    const progress = Math.round((completed / tasks.length) * 100);

    return { success: true, data: { progress, total: tasks.length, completed } };
  }

  async calculateReadiness() {
    const tasksResult = await taskService.getTasks();
    const tasks = tasksResult.success ? tasksResult.data : [];
    const completedTasks = tasks.filter((t) => t.status === 'Done');

    const check = (keywords) => {
      return completedTasks.some((t) => {
        const lower = t.title.toLowerCase();
        return keywords.some((k) => lower.includes(k.toLowerCase()));
      });
    };

    const readinessData = {
      content: {
        label: 'Content',
        items: [
          {
            name: 'Substack Setup',
            completed: check(['substack setup', 'create substack', 'setup substack']),
          },
          { name: 'Substack Welcome', completed: check(['substack welcome', 'intro post']) },
          {
            name: 'Newsletter Platform',
            completed: check(['newsletter platform', 'select mailer', 'mailing list']),
          },
          { name: 'Book Outline', completed: check(['book outline', 'chapter list']) },
          { name: 'Book Draft', completed: check(['first draft', 'manuscript']) },
        ],
      },
      practices: {
        label: 'Practices',
        items: [
          {
            name: 'Stone Concept',
            completed: check(['stone practice', 'stone concept', 'define stone']),
          },
          {
            name: 'Walk Guide',
            completed: check(['walking practice', 'walk guide', 'audio guide']),
          },
          { name: 'B2B Pitch', completed: check(['b2b pitch', 'pitch deck', 'corporate offer']) },
        ],
      },
      community: {
        label: 'Community',
        items: [
          {
            name: 'Mission Statement',
            completed: check(['mission statement', 'define mission', 'values']),
          },
          {
            name: 'Community Guidelines',
            completed: check(['guidelines', 'rules', 'code of conduct']),
          },
          { name: 'First 30 Plan', completed: check(['first 30', 'onboarding', 'initial cohort']) },
        ],
      },
      marketing: {
        label: 'Marketing',
        items: [
          { name: 'BOPA Strategy', completed: check(['bopa', 'borrowed audience']) },
          { name: 'Website Domain', completed: check(['domain', 'buy url', 'dns']) },
          { name: 'Website Launch', completed: check(['launch website', 'publish site', 'mvp']) },
          {
            name: 'Social Profiles',
            completed: check(['social media', 'instagram', 'linkedin', 'twitter']),
          },
        ],
      },
    };

    return { success: true, data: readinessData };
  }
}

export default new LaunchService();
