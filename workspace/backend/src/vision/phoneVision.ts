import { XMLParser } from "fast-xml-parser";

export type PhoneUINode = {
  text?: string;
  resourceId?: string;
  bounds: string;
  clickable?: string;
};

export function parseUIHierarchy(xml: string): PhoneUINode[] {
  const parser = new XMLParser({ ignoreAttributes: false });
  const data = parser.parse(xml);
  const nodes: PhoneUINode[] = [];

  function walk(node: any) {
    if (!node) return;

    if (node["@_bounds"]) {
      nodes.push({
        text: node["@_text"],
        resourceId: node["@_resource-id"],
        bounds: node["@_bounds"],
        clickable: node["@_clickable"]
      });
    }

    if (node.node) {
      if (Array.isArray(node.node)) node.node.forEach(walk);
      else walk(node.node);
    }
  }

  walk(data.hierarchy);
  return nodes;
}

export function boundsToCenter(bounds: string) {
  const numbers = bounds.match(/\d+/g)?.map(Number) ?? [0, 0, 0, 0];
  const [x1, y1, x2, y2] = numbers;
  return {
    x: Math.floor((x1 + x2) / 2),
    y: Math.floor((y1 + y2) / 2)
  };
}

export function findElementByText(nodes: PhoneUINode[], text: string, partial = true) {
  const q = text.toLowerCase();
  return nodes.find((n) => {
    const v = (n.text || "").toLowerCase();
    return partial ? v.includes(q) : v === q;
  });
}

export function findElementByResourceId(nodes: PhoneUINode[], resourceId: string) {
  return nodes.find((n) => (n.resourceId || "") === resourceId);
}
