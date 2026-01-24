/**
 * Calculates the optimal position for a new node on the board.
 * By default, it places the new node to the right of the existing nodes to maintain a linear flow.
 *
 * @param {Array} nodes - The current list of nodes on the board
 * @param {Object} options - Optional configuration
 * @param {number} options.defaultX - Default X position if board is empty (default: 100)
 * @param {number} options.defaultY - Default Y position if board is empty (default: 100)
 * @param {number} options.spacing - Horizontal spacing between nodes (default: 350)
 * @returns {Object} - An object containing { x, y } coordinates
 */
export const calculateNewNodePosition = (nodes, options = {}) => {
  const { defaultX = 100, defaultY = 100, spacing = 350 } = options;

  if (!nodes || nodes.length === 0) {
    return { x: defaultX, y: defaultY };
  }

  // Filter for actual work nodes (ignoring activities or decorative nodes if any)
  const workNodes = nodes.filter((n) => n.type === 'work');

  if (workNodes.length === 0) {
    return { x: defaultX, y: defaultY };
  }

  // Find the rightmost node to append after
  const rightmostNode = workNodes.reduce((prev, current) =>
    prev.position.x > current.position.x ? prev : current
  );

  return {
    x: rightmostNode.position.x + spacing,
    y: rightmostNode.position.y,
  };
};
