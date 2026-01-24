import React, { Profiler } from 'react';
import { measureComponentRender } from '../utils/performance';

/**
 * Performance Profiler wrapper component
 *
 * Wraps components to measure their render performance
 * Only active in development mode for zero production overhead
 *
 * Usage:
 *   <PerformanceProfiler id="TaskCard" enabled={true}>
 *     <TaskCard task={task} />
 *   </PerformanceProfiler>
 *
 * @param {string} id - Unique identifier for this component
 * @param {boolean} enabled - Whether profiling is enabled (default: only in dev)
 * @param {ReactNode} children - Component to profile
 */
export function PerformanceProfiler({ id, enabled = import.meta.env.DEV, children }) {
  if (!enabled) {
    return children;
  }

  const onRender = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions
  ) => {
    measureComponentRender(id, phase, actualDuration, baseDuration);
  };

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}

/**
 * HOC (Higher-Order Component) to wrap a component with profiling
 *
 * Usage:
 *   const ProfiledTaskCard = withPerformanceProfiler(TaskCard, 'TaskCard');
 */
export function withPerformanceProfiler(Component, id) {
  return function ProfiledComponent(props) {
    return (
      <PerformanceProfiler id={id}>
        <Component {...props} />
      </PerformanceProfiler>
    );
  };
}
