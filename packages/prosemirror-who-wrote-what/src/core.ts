import { EditorState } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import {
  ProsemirrorBinding,
  relativePositionToAbsolutePosition,
} from "y-prosemirror";
import { AbstractType, ContentString, ContentType, Doc, Item, Map as YMap } from "yjs";

import { createRelativePosition } from "./RelativePosition";
import { DEFAULT_COLORS, UserMapEntry, WhoWroteWhatOptions } from "./types";

/**
 * Create a scoped color assigner that maps user IDs to colors.
 *
 * Each call to `createColorAssigner` creates an independent instance with
 * its own state, so multiple editors won't conflict.
 */
export const createColorAssigner = (colors: string[] = DEFAULT_COLORS) => {
  const colorMap: Record<string | number, string> = {};
  let colorIdx = 0;

  return (userId: string | number): string => {
    if (!colorMap[userId]) {
      colorMap[userId] = colors[colorIdx % colors.length];
      colorIdx++;
    }
    return colorMap[userId];
  };
};

/**
 * Walk the Yjs document tree and collect all Items that contain text (ContentString).
 *
 * WARNING: Uses Yjs internal APIs (`element._first`, `item.next`, `item.content`).
 * These are not part of Yjs's public API and may break on major updates.
 */
export function getContentStringsFromYJSElement(
  element: AbstractType<any>,
): Item[] {
  const itemResults: Item[] = [];
  let item = element._first;
  while (item) {
    if (item.content instanceof ContentString) itemResults.push(item);
    if (item.content instanceof ContentType) {
      const result = getContentStringsFromYJSElement(item.content.type);
      itemResults.push(...result);
    }
    item = item.next;
  }
  return itemResults;
}

/**
 * Build a ProseMirror DecorationSet that highlights text by author.
 *
 * For each text item in the Yjs document, looks up the author via the shared
 * userMap and creates an inline decoration with the author's assigned color.
 */
export const getDecorationSet = (
  binding: ProsemirrorBinding,
  state: EditorState,
  userMap: YMap<UserMapEntry>,
  options: WhoWroteWhatOptions = {},
) => {
  const {
    colors,
    createDecoration: customCreateDecoration,
  } = options;

  const getColor = createColorAssigner(colors);
  const rootFragment = binding.type;
  const ydoc = binding.doc;
  const textItems = getContentStringsFromYJSElement(rootFragment);

  const decorations = textItems.map((item) => {
    const relPos = createRelativePosition(rootFragment, item.id, 0);
    const absPos = relativePositionToAbsolutePosition(
      ydoc,
      rootFragment,
      relPos,
      binding.mapping,
    );
    if (absPos == null) return null;

    const entry = userMap.get(item.id.client.toString());
    const userId = entry?.id;
    if (userId == null) return null;

    const color = getColor(userId);

    if (customCreateDecoration) {
      return customCreateDecoration(absPos, absPos + item.length, color, userId);
    }

    return Decoration.inline(absPos, absPos + item.length, {
      style: `background-color: ${color}`,
    });
  });

  return DecorationSet.create(
    state.doc,
    decorations.filter((x): x is Decoration => x != null),
  );
};

/**
 * Write the current user's clientID → userId mapping to the shared YMap.
 *
 * Called on each document change so other clients can resolve clientIDs
 * to user identities. Only writes once per clientID (skips if already present).
 */
export const writeClientIdsToYDoc = (
  ydoc: Doc,
  userId: string | number,
  userMapKey = "userMap",
) => {
  const userMap = ydoc.getMap<UserMapEntry>(userMapKey);
  const clientKey = ydoc.clientID.toString();
  const editCount = ydoc.store.clients.get(ydoc.clientID)?.length;
  if (!userMap.get(clientKey) && editCount) {
    userMap.set(clientKey, {
      id: userId,
      date: Date.now(),
    });
  }
};
