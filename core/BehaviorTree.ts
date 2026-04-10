// Minimal Behavior Tree engine for agent logic
export type BTStatus = 'success' | 'failure' | 'running';

export interface BTNode {
  tick(context: any): BTStatus;
}

export class Sequence implements BTNode {
  constructor(public children: BTNode[]) {}
  tick(context: any): BTStatus {
    for (const child of this.children) {
      const status = child.tick(context);
      if (status !== 'success') return status;
    }
    return 'success';
  }
}

export class Selector implements BTNode {
  constructor(public children: BTNode[]) {}
  tick(context: any): BTStatus {
    for (const child of this.children) {
      const status = child.tick(context);
      if (status === 'success') return 'success';
      if (status === 'running') return 'running';
    }
    return 'failure';
  }
}

export class Leaf implements BTNode {
  constructor(public action: (context: any) => BTStatus) {}
  tick(context: any): BTStatus {
    return this.action(context);
  }
}
