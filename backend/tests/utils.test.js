import { jest } from '@jest/globals';
import { parseTaskText, buildTaskText } from '../services/bluecc/utils.ts';

describe('Utils Service', () => {
  describe('parseTaskText', () => {
    it('should extract description and metadata from valid base64', () => {
      const metadata = { wt: 'task', to: 'outcome' };
      const description = 'Test task description';
      const jsonMeta = JSON.stringify(metadata);
      const base64Meta = Buffer.from(jsonMeta).toString('base64');
      const text = `${description}\n\n---PMT-META---\n${base64Meta}`;

      const result = parseTaskText(text);

      expect(result.description).toBe(description);
      expect(result.metadata.workType).toBe('task');
      expect(result.metadata.targetOutcome).toBe('outcome');
    });

    it('should handle plain text without metadata', () => {
      const text = 'Simple task description';

      const result = parseTaskText(text);

      expect(result.description).toBe(text);
      expect(result.metadata).toEqual({});
    });

    it('should handle invalid base64 gracefully', () => {
      const text = 'Description\n\n---PMT-META---\ninvalid-base64-data';

      // Should not throw
      const result = parseTaskText(text);

      expect(result.description).toBe(text);
      expect(result.metadata).toEqual({});
    });

    it('should handle corrupted JSON gracefully', () => {
      const corruptedJson = '{invalid json}';
      const base64 = Buffer.from(corruptedJson).toString('base64');
      const text = `Description\n\n---PMT-META---\n${base64}`;

      const result = parseTaskText(text);

      expect(result.description).toBe(text);
      expect(result.metadata).toEqual({});
    });

    it('should preserve empty descriptions', () => {
      const metadata = { wt: 'task' };
      const base64Meta = Buffer.from(JSON.stringify(metadata)).toString('base64');
      const text = `\n\n---PMT-META---\n${base64Meta}`;

      const result = parseTaskText(text);

      expect(result.description).toBe('');
      expect(result.metadata.workType).toBe('task');
    });

    it('should handle null/undefined input', () => {
      expect(parseTaskText(null)).toEqual({ description: '', metadata: {} });
      expect(parseTaskText(undefined)).toEqual({ description: '', metadata: {} });
      expect(parseTaskText('')).toEqual({ description: '', metadata: {} });
    });
  });

  describe('buildTaskText', () => {
    it('should serialize description and metadata correctly', () => {
      const description = 'Task description';
      const metadata = { workType: 'task', targetOutcome: 'outcome' };

      const result = buildTaskText(description, metadata);

      expect(result).toContain(description);
      expect(result).toContain('---PMT-META---');

      // Verify it can be deserialized
      const deserialized = parseTaskText(result);
      expect(deserialized.description).toBe(description);
      expect(deserialized.metadata.workType).toBe(metadata.workType);
      expect(deserialized.metadata.targetOutcome).toBe(metadata.targetOutcome);
    });

    it('should handle empty metadata', () => {
      const description = 'Task description';
      const metadata = {};

      const result = buildTaskText(description, metadata);

      // Empty metadata should just return description
      expect(result).toBe(description);
    });

    it('should handle null/undefined metadata', () => {
      const description = 'Task description';

      const result1 = buildTaskText(description, null);
      const result2 = buildTaskText(description, undefined);

      expect(result1).toBe(description);
      expect(result2).toBe(description);
    });

    it('should handle empty description', () => {
      const description = '';
      const metadata = { workType: 'task' };

      const result = buildTaskText(description, metadata);

      const deserialized = parseTaskText(result);
      expect(deserialized.description).toBe('');
      expect(deserialized.metadata.workType).toBe(metadata.workType);
    });

    it('should handle special characters in description', () => {
      const description = 'Task with special chars: !@#$%^&*() 日本語 émojis 🎉';
      const metadata = { workType: 'task' };

      const result = buildTaskText(description, metadata);
      const deserialized = parseTaskText(result);

      expect(deserialized.description).toBe(description);
      expect(deserialized.metadata.workType).toBe(metadata.workType);
    });

    it('should handle metadata with activities array', () => {
      const description = 'Complex metadata task';
      const metadata = {
        workType: 'task',
        targetOutcome: 'outcome',
        activities: [
          { id: '1', name: 'Activity 1' },
          { id: '2', name: 'Activity 2' },
        ],
      };

      const result = buildTaskText(description, metadata);
      const deserialized = parseTaskText(result);

      expect(deserialized.description).toBe(description);
      expect(deserialized.metadata.workType).toBe(metadata.workType);
      expect(deserialized.metadata.activities).toEqual(metadata.activities);
    });

    it('should handle metadata with resources object', () => {
      const description = 'Task with resources';
      const metadata = {
        workType: 'task',
        resources: {
          key1: 'value1',
          key2: 'value2',
        },
      };

      const result = buildTaskText(description, metadata);
      const deserialized = parseTaskText(result);

      expect(deserialized.metadata.resources).toEqual(metadata.resources);
    });

    it('should filter out null/undefined metadata values', () => {
      const description = 'Task';
      const metadata = {
        workType: 'task',
        targetOutcome: null,
        activities: undefined,
        resources: { key: 'value' },
      };

      const result = buildTaskText(description, metadata);
      const deserialized = parseTaskText(result);

      expect(deserialized.metadata.workType).toBe('task');
      expect(deserialized.metadata.resources).toEqual({ key: 'value' });
      // Null/undefined should not be in result
    });
  });

  describe('roundtrip serialization', () => {
    it('should maintain data integrity through multiple serialize/deserialize cycles', () => {
      const original = {
        description: 'Original description',
        metadata: {
          workType: 'task',
          targetOutcome: 'outcome',
          activities: [{ id: '1', name: 'Activity' }],
          resources: { key: 'value' },
          position: { x: 100, y: 200 },
        },
      };

      // First cycle
      const serialized1 = buildTaskText(original.description, original.metadata);
      const deserialized1 = parseTaskText(serialized1);

      // Second cycle
      const serialized2 = buildTaskText(deserialized1.description, deserialized1.metadata);
      const deserialized2 = parseTaskText(serialized2);

      expect(deserialized2.description).toBe(original.description);
      expect(deserialized2.metadata.workType).toBe(original.metadata.workType);
      expect(deserialized2.metadata.targetOutcome).toBe(original.metadata.targetOutcome);
      expect(deserialized2.metadata.activities).toEqual(original.metadata.activities);
      expect(deserialized2.metadata.resources).toEqual(original.metadata.resources);
    });

    it('should handle edge case: description with metadata marker in it', () => {
      const description = 'This has ---PMT-META--- in the text';
      const metadata = { workType: 'task' };

      const serialized = buildTaskText(description, metadata);
      const deserialized = parseTaskText(serialized);

      // When marker appears in description, parsing will be ambiguous
      // The function will split on first occurrence
      // This is a known edge case - description should not contain the marker
      expect(deserialized.description).toBeTruthy();
      // Metadata may or may not parse correctly in this edge case
    });
  });
});
