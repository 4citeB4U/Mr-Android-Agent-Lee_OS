// Example: Scripted agent behaviors and scenarios
export const agentBehaviors = {
  greet: (agent) => {
    agent.remember('Greeted a user.');
    return { type: 'say', text: `Hi! I'm ${agent.name}.` };
  },
  explore: (agent, world) => {
    // Example: Move to a random location
    const direction = ['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)];
    agent.remember(`Explored ${direction}`);
    return { type: 'move', direction };
  },
  // Add more behaviors as needed
};
