export abstract class AgentBase {
  id: string;
  name: string;
  memory: string[];
  state: Record<string, any>;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.memory = [];
    this.state = {};
  }

  abstract decide(event: any, world: any): AgentAction;
  remember(info: string) { this.memory.push(info); }
}

export interface AgentAction {
  type: string;
  [key: string]: any;
}
