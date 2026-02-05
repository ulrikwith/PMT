import { jest } from '@jest/globals';

// Mock the task service before importing relationship service
const mockGetTasks = jest.fn();
const mockUpdateTask = jest.fn();

jest.unstable_mockModule('../services/bluecc/tasks.js', () => ({
  default: {
    getTasks: mockGetTasks,
    updateTask: mockUpdateTask,
  },
}));

const { default: relationshipService } = await import('../services/bluecc/relationships.js');

// Test todoListId — passed through all calls for multi-tenancy
const TEST_LIST_ID = 'test-list-id';

describe('RelationshipService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateRelationshipId', () => {
    it('should generate unique IDs', () => {
      const id1 = relationshipService.generateRelationshipId();
      const id2 = relationshipService.generateRelationshipId();

      expect(id1).toMatch(/^rel-[a-z0-9]+-[a-f0-9]{16}$/);
      expect(id2).toMatch(/^rel-[a-z0-9]+-[a-f0-9]{16}$/);
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp and random bytes', () => {
      const id = relationshipService.generateRelationshipId();
      const parts = id.split('-');

      expect(parts[0]).toBe('rel');
      expect(parts[1]).toBeTruthy(); // timestamp
      expect(parts[2]).toHaveLength(16); // 8 bytes = 16 hex chars
    });
  });

  describe('detectCircularDependency', () => {
    it('should detect simple circular dependency (A -> B -> A)', async () => {
      const tasks = [
        { id: 'A', relationships: [{ toTaskId: 'B' }] },
        { id: 'B', relationships: [{ toTaskId: 'A' }] },
      ];

      const result = await relationshipService.detectCircularDependency('A', 'B', tasks);
      expect(result).toBe(true);
    });

    it('should detect complex circular dependency (A -> B -> C -> A)', async () => {
      const tasks = [
        { id: 'A', relationships: [{ toTaskId: 'B' }] },
        { id: 'B', relationships: [{ toTaskId: 'C' }] },
        { id: 'C', relationships: [{ toTaskId: 'A' }] },
      ];

      const result = await relationshipService.detectCircularDependency('A', 'B', tasks);
      expect(result).toBe(true);
    });

    it('should not detect circular dependency in linear chain', async () => {
      const tasks = [
        { id: 'A', relationships: [{ toTaskId: 'B' }] },
        { id: 'B', relationships: [{ toTaskId: 'C' }] },
        { id: 'C', relationships: [] },
      ];

      const result = await relationshipService.detectCircularDependency('A', 'B', tasks);
      expect(result).toBe(false);
    });

    it('should handle tasks with no relationships', async () => {
      const tasks = [
        { id: 'A', relationships: [] },
        { id: 'B', relationships: [] },
      ];

      const result = await relationshipService.detectCircularDependency('A', 'B', tasks);
      expect(result).toBe(false);
    });

    it('should handle missing relationships array', async () => {
      const tasks = [{ id: 'A' }, { id: 'B' }];

      const result = await relationshipService.detectCircularDependency('A', 'B', tasks);
      expect(result).toBe(false);
    });
  });

  describe('createTaskRelationship', () => {
    it('should reject missing required fields', async () => {
      const result1 = await relationshipService.createTaskRelationship(TEST_LIST_ID, null, 'B', 'blocks');
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Missing required fields');

      const result2 = await relationshipService.createTaskRelationship(TEST_LIST_ID, 'A', null, 'blocks');
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Missing required fields');

      const result3 = await relationshipService.createTaskRelationship(TEST_LIST_ID, 'A', 'B', null);
      expect(result3.success).toBe(false);
      expect(result3.error).toContain('Missing required fields');
    });

    it('should reject self-referencing relationships', async () => {
      const result = await relationshipService.createTaskRelationship(TEST_LIST_ID, 'A', 'A', 'blocks');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot create relationship to self');
    });

    it('should reject relationships that would create circular dependency', async () => {
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [
          { id: 'A', relationships: [{ toTaskId: 'B' }] },
          { id: 'B', relationships: [{ toTaskId: 'C' }] },
          { id: 'C', relationships: [] },
        ],
      });

      // Trying to create C -> A would create a cycle
      const result = await relationshipService.createTaskRelationship(TEST_LIST_ID, 'C', 'A', 'blocks');

      expect(result.success).toBe(false);
      expect(result.error).toContain('circular dependency');
    });

    it('should create valid relationship successfully', async () => {
      const mockTasks = [
        { id: 'A', relationships: [] },
        { id: 'B', relationships: [] },
      ];

      mockGetTasks.mockResolvedValue({
        success: true,
        data: mockTasks,
      });

      mockUpdateTask.mockResolvedValue({
        success: true,
        data: {
          id: 'A',
          relationships: [{ id: 'rel-123', fromTaskId: 'A', toTaskId: 'B', type: 'blocks' }],
        },
      });

      const result = await relationshipService.createTaskRelationship(
        TEST_LIST_ID,
        'A',
        'B',
        'blocks',
        'Test label'
      );

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        fromTaskId: 'A',
        toTaskId: 'B',
        type: 'blocks',
        label: 'Test label',
      });
      expect(result.data.id).toMatch(/^rel-/);
      expect(result.data.createdAt).toBeTruthy();
    });

    it('should handle task not found error', async () => {
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [{ id: 'A', relationships: [] }],
      });

      const result = await relationshipService.createTaskRelationship(TEST_LIST_ID, 'A', 'NonExistent', 'blocks');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Target task not found');
    });
  });

  describe('getAllRelationships', () => {
    it('should aggregate relationships from all tasks', async () => {
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [
          { id: 'A', relationships: [{ id: 'rel-1', toTaskId: 'B' }] },
          { id: 'B', relationships: [{ id: 'rel-2', toTaskId: 'C' }] },
          { id: 'C', relationships: [] },
        ],
      });

      const result = await relationshipService.getAllRelationships(TEST_LIST_ID);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('rel-1');
      expect(result.data[1].id).toBe('rel-2');
    });

    it('should handle tasks with no relationships', async () => {
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [{ id: 'A' }, { id: 'B', relationships: [] }],
      });

      const result = await relationshipService.getAllRelationships(TEST_LIST_ID);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getTaskRelationships', () => {
    it('should filter relationships for specific task (as source)', async () => {
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [
          { id: 'A', relationships: [{ id: 'rel-1', fromTaskId: 'A', toTaskId: 'B' }] },
          { id: 'B', relationships: [{ id: 'rel-2', fromTaskId: 'B', toTaskId: 'C' }] },
        ],
      });

      const result = await relationshipService.getTaskRelationships(TEST_LIST_ID, 'A');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('rel-1');
    });

    it('should filter relationships for specific task (as target)', async () => {
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [{ id: 'A', relationships: [{ id: 'rel-1', fromTaskId: 'A', toTaskId: 'B' }] }],
      });

      const result = await relationshipService.getTaskRelationships(TEST_LIST_ID, 'B');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('rel-1');
    });
  });

  describe('deleteRelationship', () => {
    it('should delete relationship successfully', async () => {
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'A',
            relationships: [
              { id: 'rel-1', toTaskId: 'B' },
              { id: 'rel-2', toTaskId: 'C' },
            ],
          },
        ],
      });

      mockUpdateTask.mockResolvedValue({ success: true });

      const result = await relationshipService.deleteRelationship(TEST_LIST_ID, 'rel-1');

      expect(result.success).toBe(true);
      expect(mockUpdateTask).toHaveBeenCalledWith(TEST_LIST_ID, 'A', {
        relationships: [{ id: 'rel-2', toTaskId: 'C' }],
      });
    });

    it('should handle relationship not found', async () => {
      mockGetTasks.mockResolvedValue({
        success: true,
        data: [{ id: 'A', relationships: [{ id: 'rel-1', toTaskId: 'B' }] }],
      });

      const result = await relationshipService.deleteRelationship(TEST_LIST_ID, 'non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Relationship not found');
    });
  });
});
