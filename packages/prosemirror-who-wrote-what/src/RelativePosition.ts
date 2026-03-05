import {
  findRootTypeKey,
  createID,
  ID,
  AbstractType,
  RelativePosition,
} from "yjs";

// From Yjs source code (RelativePosition.js)
// This function is not exported by Yjs, so we replicate it here.
// Uses internal API: type._item

export const createRelativePosition = (
  type: AbstractType<any>,
  item: ID | null,
  assoc: number,
): RelativePosition => {
  let typeid = null;
  let tname = null;
  if (type._item === null) {
    tname = findRootTypeKey(type);
  } else {
    typeid = createID(type._item.id.client, type._item.id.clock);
  }
  return new RelativePosition(typeid, tname, item, assoc);
};
