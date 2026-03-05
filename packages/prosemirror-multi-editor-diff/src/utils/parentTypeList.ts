import { Node } from "prosemirror-model";

export const getParentTypeList = (
  doc: Node | undefined,
  pos: number,
): string[] => {
  if (doc === undefined) return [];
  const parentTypeList: string[] = [];
  let position = doc.resolve(pos);
  while (position.parent && position.depth !== 0) {
    parentTypeList.push(position.parent.type.name);
    position = doc.resolve(position.before());
  }
  return parentTypeList;
};
