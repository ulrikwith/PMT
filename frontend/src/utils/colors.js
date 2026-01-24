/**
 * Color utilities for dynamic class generation
 * Tailwind doesn't support dynamic class names, so we need to map colors to static classes
 */

const COLOR_CLASSES = {
  blue: {
    bg: 'bg-blue-500',
    bgOpacity: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    borderSolid: 'border-blue-500',
    borderOpacity: 'border-blue-500/30',
    dot: 'bg-blue-500',
  },
  purple: {
    bg: 'bg-purple-500',
    bgOpacity: 'bg-purple-500/10',
    text: 'text-purple-500',
    border: 'border-purple-500/20',
    borderSolid: 'border-purple-500',
    borderOpacity: 'border-purple-500/30',
    dot: 'bg-purple-500',
  },
  green: {
    bg: 'bg-green-500',
    bgOpacity: 'bg-green-500/10',
    text: 'text-green-500',
    border: 'border-green-500/20',
    borderSolid: 'border-green-500',
    borderOpacity: 'border-green-500/30',
    dot: 'bg-green-500',
  },
  amber: {
    bg: 'bg-amber-500',
    bgOpacity: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    borderSolid: 'border-amber-500',
    borderOpacity: 'border-amber-500/30',
    dot: 'bg-amber-500',
  },
  red: {
    bg: 'bg-red-500',
    bgOpacity: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/20',
    borderSolid: 'border-red-500',
    borderOpacity: 'border-red-500/30',
    dot: 'bg-red-500',
  },
  slate: {
    bg: 'bg-slate-500',
    bgOpacity: 'bg-slate-500/10',
    text: 'text-slate-500',
    border: 'border-slate-500/20',
    borderSolid: 'border-slate-500',
    borderOpacity: 'border-slate-500/30',
    dot: 'bg-slate-500',
  },
  indigo: {
    bg: 'bg-indigo-500',
    bgOpacity: 'bg-indigo-500/10',
    text: 'text-indigo-500',
    border: 'border-indigo-500/20',
    borderSolid: 'border-indigo-500',
    borderOpacity: 'border-indigo-500/30',
    dot: 'bg-indigo-500',
  },
};

/**
 * Get Tailwind class names for a given color
 * @param {string} color - Color name (e.g., 'blue', 'purple')
 * @param {string} variant - Variant type (e.g., 'bg', 'bgOpacity', 'text')
 * @returns {string} Tailwind class name
 */
export function getColorClass(color, variant = 'bg') {
  const colorMap = COLOR_CLASSES[color] || COLOR_CLASSES.slate;
  return colorMap[variant] || colorMap.bg;
}

/**
 * Get combined class names for a dimension color
 * @param {string} color - Color name
 * @param {boolean} isActive - Whether this is the active state
 * @returns {string} Combined class names
 */
export function getDimensionClasses(color, isActive = false) {
  if (isActive) {
    return `${getColorClass(color, 'bgOpacity')} ${getColorClass(color, 'borderOpacity')} ${getColorClass(color, 'text')} border-2`;
  }
  return 'bg-slate-800/40 border border-white/10 text-slate-400';
}

/**
 * Get breadcrumb classes for a given color
 * @param {string} color - Color name
 * @returns {string} Combined class names
 */
export function getBreadcrumbClasses(color) {
  if (!color) return 'text-slate-400';
  return `${getColorClass(color, 'bgOpacity')} ${getColorClass(color, 'text')}`;
}

/**
 * Get step indicator classes
 * @param {string} color - Color name
 * @returns {object} Object with class names for different parts
 */
export function getStepClasses(color) {
  return {
    container: `p-4 rounded-2xl ${getColorClass(color, 'bgOpacity')} ${getColorClass(color, 'text')} ${getColorClass(color, 'border')} border shadow-lg`,
    background: `absolute top-0 right-0 w-32 h-32 ${getColorClass(color, 'bgOpacity')} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none`,
    icon: `p-3 rounded-lg ${getColorClass(color, 'bgOpacity')} ${getColorClass(color, 'text')} ${getColorClass(color, 'border')} border`,
  };
}

export default {
  getColorClass,
  getDimensionClasses,
  getBreadcrumbClasses,
  getStepClasses,
};
