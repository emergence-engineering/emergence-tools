// from prosemirror-utils

// :: (node: ProseMirrorNode, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
// Flattens descendants of a given `node`. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
//
// ```javascript
// const children = flatten(node);
// ```
import { Node } from "prosemirror-model";

export interface NodeWithPos {
  node: Node;
  pos: number;
}
export const flatten = (node: Node, descend = true) => {
  if (!node) {
    throw new Error('Invalid "node" parameter');
  }
  const result: NodeWithPos[] = [];
  node.descendants((child, pos) => {
    result.push({ node: child, pos });
    if (!descend) {
      return false;
    }
    return undefined;
  });
  return result;
};

// :: (node: ProseMirrorNode, predicate: (node: ProseMirrorNode) → boolean, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
// Iterates over descendants of a given `node`, returning child nodes predicate returns truthy for. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
//
// ```javascript
// const textNodes = findChildren(node, child => child.isText, false);
// ```
export const findChildren = (
  node: Node,
  predicate: (child: Node) => boolean,
  descend: boolean
) => {
  if (!node) {
    throw new Error('Invalid "node" parameter');
  } else if (!predicate) {
    throw new Error('Invalid "predicate" parameter');
  }
  return flatten(node, descend).filter((child) => predicate(child.node));
};

// :: (node: ProseMirrorNode, descend: ?boolean) → [{ node: ProseMirrorNode, pos: number }]
// Returns text nodes of a given `node`. It doesn't descend into a node when descend argument is `false` (defaults to `true`).
//
// ```javascript
// const textNodes = findTextNodes(node);
// ```
export const findTextNodes = (node: Node, descend = true) => {
  return findChildren(node, (child) => child.isText, descend);
};
