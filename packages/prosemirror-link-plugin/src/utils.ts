import { Transaction } from "prosemirror-state";
import { SpecObject } from "./types";

export const generateRegex = (aliases: string[]): RegExp => {
  const pattern = aliases.length
    ? aliases
        .map((alias) => `\\b${alias.trim()}\\b`)
        .sort((a, b) => b.length - a.length)
        .join("|")
    : // match nothing
      "a^";
  return new RegExp(pattern, "g");
};

export const getTransactionRange = (tr: Transaction) => {
  let start = tr.doc.nodeSize;
  let end = 0;
  for (let i = 0; i < tr.mapping.maps.length; i += 1) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mapStart = tr.mapping.maps[i].ranges[0];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mapEnd = mapStart + tr.mapping.maps[i].ranges[2];
    start = Math.min(start, mapStart, mapEnd);
    end = Math.max(end, mapStart, mapEnd);
  }
  return { start, end };
};

export const specEquals = (specA: SpecObject, specB: SpecObject) => {
  const keysA = Object.keys(specA);
  const keysB = Object.keys(specB);
  return (
    keysA.length === keysB.length &&
    keysA.reduce((acc, key) => acc && specB[key] === specA[key], true)
  );
};
