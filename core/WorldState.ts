export class WorldState {
  state: Record<string, any> = {};
  log: string[] = [];

  update(key: string, value: any) {
    this.state[key] = value;
    this.log.push(`World updated: ${key} = ${JSON.stringify(value)}`);
  }

  get(key: string) {
    return this.state[key];
  }
}
