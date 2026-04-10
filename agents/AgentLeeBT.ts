import { AgentBase } from '../core/AgentBase';
import { BTNode, Sequence, Selector, Leaf } from '../core/BehaviorTree';

export class AgentLeeBT extends AgentBase {
  tree: BTNode;
  constructor(id: string, name: string) {
    super(id, name);
    this.tree = new Selector([
      new Sequence([
        new Leaf(ctx => ctx.event.type === 'greet' ? (ctx.say('Hello!'), 'success') : 'failure'),
      ]),
      new Leaf(ctx => (ctx.idle(), 'success')),
    ]);
  }
  decide(event: any, world: any) {
    const context = { ...this, event, world, say: (t: string) => this.memory.push('Said: ' + t), idle: () => this.memory.push('Idle') };
    this.tree.tick(context);
    return { type: 'done', memory: this.memory.slice(-5) };
  }
}
