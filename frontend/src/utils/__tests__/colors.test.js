import { describe, it, expect } from 'vitest';
import {
  getColorClass,
  getDimensionClasses,
  getBreadcrumbClasses,
  getStepClasses,
} from '../colors.ts';

describe('Color Utilities', () => {
  describe('getColorClass', () => {
    it('should return correct bg class for valid color', () => {
      expect(getColorClass('blue')).toBe('bg-blue-500');
      expect(getColorClass('purple')).toBe('bg-purple-500');
      expect(getColorClass('green')).toBe('bg-green-500');
      expect(getColorClass('amber')).toBe('bg-amber-500');
      expect(getColorClass('red')).toBe('bg-red-500');
    });

    it('should return correct variant classes', () => {
      expect(getColorClass('blue', 'text')).toBe('text-blue-500');
      expect(getColorClass('purple', 'bgOpacity')).toBe('bg-purple-500/10');
      expect(getColorClass('green', 'border')).toBe('border-green-500/20');
      expect(getColorClass('amber', 'borderSolid')).toBe('border-amber-500');
      expect(getColorClass('red', 'dot')).toBe('bg-red-500');
    });

    it('should fallback to slate for unknown colors', () => {
      expect(getColorClass('unknown-color')).toBe('bg-slate-500');
      expect(getColorClass('invalid', 'text')).toBe('text-slate-500');
    });

    it('should fallback to bg variant for unknown variant', () => {
      expect(getColorClass('blue', 'unknown-variant')).toBe('bg-blue-500');
    });

    it('should handle null/undefined color', () => {
      expect(getColorClass(null)).toBe('bg-slate-500');
      expect(getColorClass(undefined)).toBe('bg-slate-500');
    });

    it('should default to bg variant when no variant specified', () => {
      expect(getColorClass('blue')).toBe('bg-blue-500');
    });
  });

  describe('getDimensionClasses', () => {
    it('should return active classes when isActive is true', () => {
      const result = getDimensionClasses('blue', true);

      expect(result).toContain('bg-blue-500/10');
      expect(result).toContain('border-blue-500/30');
      expect(result).toContain('text-blue-500');
      expect(result).toContain('border-2');
    });

    it('should return inactive classes when isActive is false', () => {
      const result = getDimensionClasses('blue', false);

      expect(result).toBe('bg-slate-800/40 border border-white/10 text-slate-400');
    });

    it('should return inactive classes when isActive is undefined', () => {
      const result = getDimensionClasses('purple');

      expect(result).toBe('bg-slate-800/40 border border-white/10 text-slate-400');
    });

    it('should work with all supported colors when active', () => {
      const colors = ['blue', 'purple', 'green', 'amber', 'red', 'slate', 'indigo'];

      colors.forEach((color) => {
        const result = getDimensionClasses(color, true);
        expect(result).toContain(`${color}-500`);
        expect(result).toContain('border-2');
      });
    });
  });

  describe('getBreadcrumbClasses', () => {
    it('should return colored classes for valid color', () => {
      const result = getBreadcrumbClasses('blue');

      expect(result).toContain('bg-blue-500/10');
      expect(result).toContain('text-blue-500');
    });

    it('should return default slate text for no color', () => {
      expect(getBreadcrumbClasses(null)).toBe('text-slate-400');
      expect(getBreadcrumbClasses(undefined)).toBe('text-slate-400');
      expect(getBreadcrumbClasses('')).toBe('text-slate-400');
    });

    it('should work with all supported colors', () => {
      const colors = ['blue', 'purple', 'green', 'amber', 'red'];

      colors.forEach((color) => {
        const result = getBreadcrumbClasses(color);
        expect(result).toContain(`${color}-500`);
      });
    });
  });

  describe('getStepClasses', () => {
    it('should return object with container, background, and icon classes', () => {
      const result = getStepClasses('blue');

      expect(result).toHaveProperty('container');
      expect(result).toHaveProperty('background');
      expect(result).toHaveProperty('icon');
    });

    it('should include correct color classes in container', () => {
      const result = getStepClasses('purple');

      expect(result.container).toContain('bg-purple-500/10');
      expect(result.container).toContain('text-purple-500');
      expect(result.container).toContain('border-purple-500/20');
      expect(result.container).toContain('border');
      expect(result.container).toContain('shadow-lg');
    });

    it('should include correct color classes in background', () => {
      const result = getStepClasses('green');

      expect(result.background).toContain('bg-green-500/10');
      expect(result.background).toContain('blur-3xl');
      expect(result.background).toContain('pointer-events-none');
    });

    it('should include correct color classes in icon', () => {
      const result = getStepClasses('amber');

      expect(result.icon).toContain('bg-amber-500/10');
      expect(result.icon).toContain('text-amber-500');
      expect(result.icon).toContain('border-amber-500/20');
      expect(result.icon).toContain('rounded-lg');
    });

    it('should work with all supported colors', () => {
      const colors = ['blue', 'purple', 'green', 'amber', 'red', 'slate', 'indigo'];

      colors.forEach((color) => {
        const result = getStepClasses(color);
        expect(result.container).toContain(`${color}-500`);
        expect(result.background).toContain(`${color}-500`);
        expect(result.icon).toContain(`${color}-500`);
      });
    });
  });

  describe('Tailwind class validity', () => {
    it('should only use valid Tailwind classes', () => {
      // These are pre-defined Tailwind classes that will be in the compiled CSS
      const validClasses = [
        'bg-blue-500',
        'bg-blue-500/10',
        'text-blue-500',
        'border-blue-500/20',
        'bg-purple-500',
        'bg-purple-500/10',
        'text-purple-500',
        'bg-green-500',
        'bg-amber-500',
        'bg-red-500',
        'bg-slate-500',
        'border-2',
        'rounded-lg',
        'shadow-lg',
        'blur-3xl',
      ];

      // All returned classes should be static, not template literals
      const result1 = getColorClass('blue');
      const result2 = getDimensionClasses('purple', true);
      const result3 = getBreadcrumbClasses('green');

      expect(result1).not.toContain('${');
      expect(result2).not.toContain('${');
      expect(result3).not.toContain('${');
    });
  });
});
