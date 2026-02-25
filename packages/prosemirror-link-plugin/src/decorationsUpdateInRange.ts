import { Decoration } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { findTextNodes, NodeWithPos } from "./prosemirror-utils";

import { LinksKeyState, SpecObject } from "./types";
import { specEquals } from "./utils";

const decorationsUpdateInRange = <T extends SpecObject>(
  from: number,
  to: number,
  doc: Node,
  pluginState: LinksKeyState<T>,
  createAliasDecoration: (
    decorationStart: number,
    decorationEnd: number,
    alias: string,
    matchPos: number,
    linkPluginState: LinksKeyState<T>,
    docNode: Node
  ) => Decoration
): {
  decorationsToAdd: Decoration[];
  decorationsToRemove: Decoration[];
} => {
  let start = from;
  const stayingDecorations: Decoration[] = [];
  let decorationsToAdd: Decoration[] = [];
  const decorationsToRemove: Decoration[] = [];
  let existingDecorations: Decoration[] = [];
  do {
    const startData = doc.resolve(start);
    const parentNode = startData.parent;
    const parentPos = start - startData.parentOffset;
    const parentEnd = parentPos + parentNode.nodeSize;
    const parentDecorations = pluginState.decorations
      .find(
        parentPos,
        parentEnd
        // TODO: Maybe fix type? This filter is necessary because if a decoration is on the boundary of the next node at the end of the range then it will get picked up
      )
      .filter(
        (decoration) =>
          decoration.from >= parentPos && decoration.to <= parentEnd
      ) as Decoration[];
    existingDecorations = [...existingDecorations, ...parentDecorations];
    const textNodes = findTextNodes(parentNode);
    // eslint-disable-next-line no-loop-func
    textNodes.map((nodeWithPos: NodeWithPos) => {
      const matches = Array.from(
        nodeWithPos.node?.text?.matchAll(pluginState.regex) || []
      );
      // eslint-disable-next-line array-callback-return
      return matches.map((match) => {
        if (!match) {
          throw new Error("wrong match");
        }
        const matchIndex = match.index || 0;
        const alias = match[0];
        const decorationStart = nodeWithPos.pos + matchIndex + parentPos;
        const decorationEnd =
          nodeWithPos.pos + matchIndex + alias.length + parentPos;
        const matchPos = nodeWithPos.pos + matchIndex;
        const newDecoration = createAliasDecoration(
          decorationStart,
          decorationEnd,
          alias,
          matchPos,
          pluginState,
          doc
        );
        decorationsToAdd = [...decorationsToAdd, newDecoration];
      });
    });
    start += parentNode.nodeSize;
    // Run at least once
  } while (start < to);

  existingDecorations.map((decoration) => {
    const addedDecoration = decorationsToAdd.find(
      (addDecor) =>
        addDecor.from === decoration.from &&
        addDecor.to === decoration.to &&
        specEquals(addDecor.spec, decoration.spec)
    );
    if (addedDecoration) {
      stayingDecorations.push(addedDecoration);
    } else {
      decorationsToRemove.push(decoration);
    }
    return null;
  });

  decorationsToAdd = decorationsToAdd.filter(
    (addedDecoration) => !stayingDecorations.includes(addedDecoration)
  );

  return {
    decorationsToAdd,
    decorationsToRemove,
  };
};

export default decorationsUpdateInRange;
