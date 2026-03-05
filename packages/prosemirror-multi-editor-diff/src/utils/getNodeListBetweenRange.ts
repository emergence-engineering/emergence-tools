import {
  docToTextWithMapping,
  TextMappingItem,
} from "@emergence-engineering/prosemirror-text-map";
import { Node } from "prosemirror-model";

import { nonEmpty } from "./typeHelpers";

export interface NodeHelperObj {
  context: string;
  from: number;
  mapping: TextMappingItem[];
  node: Node;
  text: string;
  to: number;
}

export const imageNodeToTextMapping = (node: Node): { text: string; mapping: TextMappingItem[] } => {
  if (node.type.name === "image") {
    const attributes = [
      node.attrs.width !== null ? "width=" + node.attrs.width : null,
      node.attrs.height !== null ? "height=" + node.attrs.height : null,
      node.attrs.maxWidth !== null ? "maxWidth=" + node.attrs.maxWidth : null,
      node.attrs.align !== null ? "align=" + node.attrs.align : null,
    ].filter(nonEmpty);
    const imageText = `![${node.attrs.alt || ""}](${
      node.attrs.src || ""
    }){${attributes.join(", ")}} `;
    const mapping: TextMappingItem[] = [];
    for (let i = 0; i < imageText.length; i++) {
      mapping.push({ docPos: -1, textPos: i });
    }
    mapping.push({ docPos: 0, textPos: imageText.length });
    return {
      mapping,
      text: imageText,
    };
  }
  return {
    mapping: [{ docPos: 0, textPos: 0 }],
    text: "",
  };
};

export const getNodeListBetweenRange = (
  from: number,
  to: number,
  doc: Node,
  DIFFABLE_NODE_TYPES: Set<string>,
  NON_DIFFABLE_NODE_TYPES: Set<string>,
  skipEmpty: boolean = true,
  addImagesToText: boolean = false,
) => {
  const helperNodes: NodeHelperObj[] = [];

  let context = "";
  doc.descendants((node, pos) => {
    const nodeIsInRange = pos + node.nodeSize >= from && pos <= to;
    if (!nodeIsInRange) return;
    if (NON_DIFFABLE_NODE_TYPES.has(node.type.name)) return false;

    if (
      DIFFABLE_NODE_TYPES.has(node.type.name) &&
      (!skipEmpty || node.textContent.trim().length > 0)
    ) {
      const from = pos + 1;
      const to = from + node.nodeSize - 1;
      const { mapping, text } = docToTextWithMapping(
        node,
        addImagesToText
          ? { nodeToTextMappingOverride: { image: imageNodeToTextMapping } }
          : {},
      );
      helperNodes.push({
        node,
        context,
        from,
        mapping,
        text,
        to,
      });
      context += "\n" + text;
    }
  });

  return helperNodes;
};
