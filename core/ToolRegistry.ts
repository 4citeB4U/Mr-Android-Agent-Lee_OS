export const ToolRegistry = {
  move: (agent, params) => {
    return { type: 'move', ...params };
  },
  speak: (agent, params) => {
    return { type: 'say', text: params.text };
  },
  // Add more tools/actions as needed
};
