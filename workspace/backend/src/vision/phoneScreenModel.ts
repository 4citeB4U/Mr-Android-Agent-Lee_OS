export type ScreenElement = {
  text?: string;
  resourceId?: string;
  clickable?: boolean;
  bounds: string;
  centerX: number;
  centerY: number;
};

export function buildScreenModel(nodes: any[]): ScreenElement[] {
  return nodes.map((n) => {
    // Expected bounds format: [x0,y0][x1,y1]
    const match = /\[(\d+),(\d+)\]\[(\d+),(\d+)\]/.exec(n.bounds);
    let x = 0;
    let y = 0;

    if (match) {
      x = Math.floor((parseInt(match[1]) + parseInt(match[3])) / 2);
      y = Math.floor((parseInt(match[2]) + parseInt(match[4])) / 2);
    }

    return {
      text: n.text,
      resourceId: n.resourceId,
      clickable: n.clickable === "true",
      bounds: n.bounds || "",
      centerX: x,
      centerY: y
    };
  });
}
