import { Node, Schema } from "prosemirror-model";
import {
  getUnitsInRange,
} from "@emergence-engineering/prosemirror-block-runner";
import {
  docToTextWithMapping,
  textPosToDocPos,
} from "@emergence-engineering/prosemirror-text-map";
import { getNodeListBetweenRange } from "../utils/getNodeListBetweenRange";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    heading: {
      content: "text*",
      group: "block",
      attrs: { level: { default: 1 } },
    },
    paragraph: { content: "text*", group: "block" },
    blockquote: { content: "block+", group: "block" },
    code_block: { content: "text*", group: "block" },
    text: {},
  },
  marks: {},
});

const DIFFABLE = new Set(["heading", "paragraph"]);
const NON_DIFFABLE = new Set(["code_block"]);

function makeDoc(...children: Node[]): Node {
  return schema.nodes.doc.create(null, children);
}

function p(text: string): Node {
  if (text === "") return schema.nodes.paragraph.create(null);
  return schema.nodes.paragraph.create(null, [schema.text(text)]);
}

function h(level: number, text: string): Node {
  if (text === "") return schema.nodes.heading.create({ level });
  return schema.nodes.heading.create({ level }, [schema.text(text)]);
}

describe("Position convention alignment", () => {
  const doc = makeDoc(h(2, "Title"), p("Hello world"), p("Second paragraph"));

  test("getNodeListBetweenRange from = unit.from + 1, to = unit.to", () => {
    const nodeList = getNodeListBetweenRange(
      0, doc.nodeSize, doc, DIFFABLE, NON_DIFFABLE, true, false,
    );
    const units = getUnitsInRange(doc, 0, doc.content.size, ["heading", "paragraph"]);

    expect(nodeList.length).toBe(units.length);

    for (let i = 0; i < nodeList.length; i++) {
      // nodeList.from = pos + 1 (content start), unit.from = pos (node boundary)
      expect(nodeList[i].from).toBe(units[i].from + 1);
      // nodeList.to = (pos+1) + nodeSize - 1 = pos + nodeSize = unit.to
      expect(nodeList[i].to).toBe(units[i].to);
    }
  });

  test("text content matches between the two extraction methods", () => {
    const nodeList = getNodeListBetweenRange(
      0, doc.nodeSize, doc, DIFFABLE, NON_DIFFABLE, true, false,
    );
    const units = getUnitsInRange(doc, 0, doc.content.size, ["heading", "paragraph"]);

    for (let i = 0; i < nodeList.length; i++) {
      expect(nodeList[i].text).toBe(units[i].text);
    }
  });
});

describe("Metadata array alignment", () => {
  test("with empty paragraphs - skipEmpty=false causes misalignment", () => {
    const doc = makeDoc(p("First"), p(""), p("Third"));

    const nodeListIncludingEmpty = getNodeListBetweenRange(
      0, doc.nodeSize, doc, DIFFABLE, NON_DIFFABLE, false, false,
    );
    const nodeListSkippingEmpty = getNodeListBetweenRange(
      0, doc.nodeSize, doc, DIFFABLE, NON_DIFFABLE, true, false,
    );
    const units = getUnitsInRange(doc, 0, doc.content.size, ["heading", "paragraph"]);

    // Block-runner always skips empty nodes
    expect(units.length).toBe(2); // "First", "Third"
    expect(nodeListIncludingEmpty.length).toBe(3); // "First", "", "Third" - MISMATCH
    expect(nodeListSkippingEmpty.length).toBe(2); // "First", "Third" - MATCHES

    // With skipEmpty=true, indices align correctly
    for (let i = 0; i < units.length; i++) {
      expect(nodeListSkippingEmpty[i].text).toBe(units[i].text);
    }
  });

  test("without empty paragraphs - both skipEmpty values work", () => {
    const doc = makeDoc(p("First"), p("Second"), p("Third"));

    const nodeList = getNodeListBetweenRange(
      0, doc.nodeSize, doc, DIFFABLE, NON_DIFFABLE, false, false,
    );
    const units = getUnitsInRange(doc, 0, doc.content.size, ["heading", "paragraph"]);

    expect(nodeList.length).toBe(units.length);
    expect(nodeList.length).toBe(3);
  });
});

describe("docToTextWithMapping on resolved nodes", () => {
  const doc = makeDoc(p("Hello world"), p("Test paragraph"));

  test("resolvedNode text matches unit text", () => {
    const units = getUnitsInRange(doc, 0, doc.content.size, ["heading", "paragraph"]);

    for (const unit of units) {
      const resolvedNode = doc.nodeAt(unit.from);
      expect(resolvedNode).not.toBeNull();
      const textMapResult = docToTextWithMapping(resolvedNode!);
      expect(textMapResult.text).toBe(unit.text);
    }
  });

  test("textPosToDocPos gives positions relative to node start (0-based)", () => {
    const units = getUnitsInRange(doc, 0, doc.content.size, ["heading", "paragraph"]);

    const firstUnit = units[0]; // "Hello world"
    const resolvedNode = doc.nodeAt(firstUnit.from)!;
    const textMapResult = docToTextWithMapping(resolvedNode);

    // For position 0 ("H"), textPosToDocPos should return 0
    const docPos0 = textPosToDocPos(0, textMapResult.mapping);
    expect(docPos0).toBe(0);

    // For position 5 (" " space), textPosToDocPos should return 5
    const docPos5 = textPosToDocPos(5, textMapResult.mapping);
    expect(docPos5).toBe(5);

    // Absolute doc position = nodeContentFrom + docPos
    const nodeContentFrom = firstUnit.from + 1;
    // "H" is at absolute position nodeContentFrom + 0
    expect(nodeContentFrom + docPos0).toBe(firstUnit.from + 1);
  });
});

describe("Decoration position correctness", () => {
  test("inline decoration positions are within node bounds", () => {
    const doc = makeDoc(p("Hello world"), p("Modified world"));
    const units = getUnitsInRange(doc, 0, doc.content.size, ["heading", "paragraph"]);

    // Simulate what renderInlineDecorators does:
    // For unit[0] "Hello world", say diff adds "Hello" (positions 0-5)
    const unit = units[0];
    const resolvedNode = doc.nodeAt(unit.from)!;
    const textMapResult = docToTextWithMapping(resolvedNode);
    const nodeContentFrom = unit.from + 1;

    // Decoration from position for text range 0..5
    const fromPos = nodeContentFrom + textPosToDocPos(0, textMapResult.mapping);
    const toPos = nodeContentFrom + textPosToDocPos(5, textMapResult.mapping);

    // Must be within document bounds
    expect(fromPos).toBeGreaterThanOrEqual(0);
    expect(toPos).toBeLessThanOrEqual(doc.content.size);

    // Must be within node bounds
    expect(fromPos).toBeGreaterThanOrEqual(unit.from + 1);
    expect(toPos).toBeLessThanOrEqual(unit.to);

    // fromPos should be at start of content
    expect(fromPos).toBe(unit.from + 1);
    // toPos should be at position 5 within content
    expect(toPos).toBe(unit.from + 1 + 5);
  });
});

describe("Full metadata + diff flow simulation", () => {
  const leftDoc = makeDoc(
    h(2, "Project Overview"),
    p("ProseMirror is a toolkit for building rich-text editors."),
    p("It provides tools and concepts for building editors."),
  );
  const rightDoc = makeDoc(
    h(2, "Project Overview"),
    p("ProseMirror is a powerful toolkit for building editors."),
    p("It provides comprehensive tools for building editors."),
  );

  test("node identity is preserved across multiple getNodeListBetweenRange calls", () => {
    // Simulates what calcPairings does
    const leftNodeList1 = getNodeListBetweenRange(
      0, leftDoc.nodeSize, leftDoc, DIFFABLE, NON_DIFFABLE, true, true,
    );
    // Simulates what sendPluginInitTransaction does (second call on same doc)
    const leftNodeList2 = getNodeListBetweenRange(
      0, leftDoc.nodeSize, leftDoc, DIFFABLE, NON_DIFFABLE, true, true,
    );

    expect(leftNodeList1.length).toBe(leftNodeList2.length);
    for (let i = 0; i < leftNodeList1.length; i++) {
      // Node objects must be identical (same reference) across calls
      expect(leftNodeList1[i].node).toBe(leftNodeList2[i].node);
    }
  });

  test("stringNodePairing stores original node references", () => {
    const { stringNodePairing, defaultStringSimilarity } = require("../stringNodePairing");

    const leftNodeList = getNodeListBetweenRange(
      0, leftDoc.nodeSize, leftDoc, DIFFABLE, NON_DIFFABLE, true, true,
    );
    const rightNodeList = getNodeListBetweenRange(
      0, rightDoc.nodeSize, rightDoc, DIFFABLE, NON_DIFFABLE, true, true,
    );
    const leftNodes = leftNodeList.map((n: any) => n.node);
    const rightNodes = rightNodeList.map((n: any) => n.node);

    const pairings = stringNodePairing({
      bodyExtractor: (node: Node) => node.textContent,
      leftSideNodes: leftNodes,
      rightSideNodes: rightNodes,
      similarity: { fromString: defaultStringSimilarity },
      insertDeleteWeight: 0,
    });

    // There should be pairings
    expect(pairings.length).toBeGreaterThan(0);

    // Each pairing's leftNode.node should be a reference to a node from leftNodes
    for (const pairing of pairings) {
      if (pairing.leftNode) {
        expect(leftNodes).toContain(pairing.leftNode.node);
      }
      if (pairing.rightNode) {
        expect(rightNodes).toContain(pairing.rightNode.node);
      }
    }
  });

  test("metadata factory finds all nodes in pairings (simulates nodeAdditionalDataSideHelper)", () => {
    const { stringNodePairing, defaultStringSimilarity } = require("../stringNodePairing");

    // Step 1: calcPairings
    const leftNodeList = getNodeListBetweenRange(
      0, leftDoc.nodeSize, leftDoc, DIFFABLE, NON_DIFFABLE, true, true,
    );
    const rightNodeList = getNodeListBetweenRange(
      0, rightDoc.nodeSize, rightDoc, DIFFABLE, NON_DIFFABLE, true, true,
    );
    const pairings = stringNodePairing({
      bodyExtractor: (node: Node) => node.textContent,
      leftSideNodes: leftNodeList.map((n: any) => n.node),
      rightSideNodes: rightNodeList.map((n: any) => n.node),
      similarity: { fromString: defaultStringSimilarity },
      insertDeleteWeight: 0,
    });

    // Step 2: sendPluginInitTransaction - new nodeList call
    const leftNodeListForInit = getNodeListBetweenRange(
      0, leftDoc.nodeSize, leftDoc, DIFFABLE, NON_DIFFABLE, true, true,
    );

    // Step 3: Simulate nodeAdditionalDataSideHelper for left side
    const sideNode = (pair: any) => pair.leftNode?.node;
    const metadataArray = leftNodeListForInit.map((nodeHelperObj: any) => {
      const { node } = nodeHelperObj;
      const firstIdx = pairings.findIndex(
        (pair: any) => sideNode(pair) === node,
      );
      return {
        found: firstIdx !== -1,
        nodeText: node.textContent,
        pairIndex: firstIdx,
        hasPairs: firstIdx !== -1,
      };
    });

    // ALL nodes should be found in pairings
    for (const meta of metadataArray) {
      expect(meta.found).toBe(true);
    }
    // No undefined pairs
    expect(metadataArray.every((m: any) => m.hasPairs)).toBe(true);
  });

  test("diff computation produces partial (not full) diffs for similar text", () => {
    const Diff = require("diff");
    const { stringNodePairing, defaultStringSimilarity } = require("../stringNodePairing");

    const leftNodeList = getNodeListBetweenRange(
      0, leftDoc.nodeSize, leftDoc, DIFFABLE, NON_DIFFABLE, true, true,
    );
    const rightNodeList = getNodeListBetweenRange(
      0, rightDoc.nodeSize, rightDoc, DIFFABLE, NON_DIFFABLE, true, true,
    );
    const pairings = stringNodePairing({
      bodyExtractor: (node: Node) => node.textContent,
      leftSideNodes: leftNodeList.map((n: any) => n.node),
      rightSideNodes: rightNodeList.map((n: any) => n.node),
      similarity: { fromString: defaultStringSimilarity },
      insertDeleteWeight: 0,
    });

    // For each left node, find its pair and compute the diff
    for (const leftNodeHelper of leftNodeList) {
      const sideNode = (pair: any) => pair.leftNode?.node;
      const firstIdx = pairings.findIndex(
        (pair: any) => sideNode(pair) === leftNodeHelper.node,
      );
      expect(firstIdx).not.toBe(-1);

      const pair = pairings[firstIdx];
      const rightNode = pair.rightNode?.node;

      if (rightNode) {
        const prevText = docToTextWithMapping(rightNode);
        const nextText = docToTextWithMapping(leftNodeHelper.node);
        const diff = Diff.diffWordsWithSpace(prevText.text, nextText.text);

        // For similar text, there should be some unchanged parts
        const unchangedParts = diff.filter((d: any) => !d.added && !d.removed);
        expect(unchangedParts.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("Multi-paragraph scenario end-to-end", () => {
  test("all unit positions are valid and nodeAt resolves", () => {
    const doc = makeDoc(
      h(2, "Document Title"),
      p("First paragraph with some text."),
      p("Second paragraph with different text."),
      p("Third paragraph that is unique."),
    );

    const units = getUnitsInRange(doc, 0, doc.content.size, ["heading", "paragraph"]);

    expect(units.length).toBe(4);

    for (const unit of units) {
      // unit.from should be a valid position
      expect(unit.from).toBeGreaterThanOrEqual(0);
      expect(unit.to).toBeLessThanOrEqual(doc.nodeSize);

      // doc.nodeAt(unit.from) should give us the paragraph/heading
      const nodeAtFrom = doc.nodeAt(unit.from);
      expect(nodeAtFrom).not.toBeNull();
      expect(["heading", "paragraph"]).toContain(nodeAtFrom!.type.name);

      // docToTextWithMapping on resolved node should give same text
      const resolvedNode = doc.nodeAt(unit.from)!;
      const textMapResult = docToTextWithMapping(resolvedNode);
      expect(textMapResult.text).toBe(unit.text);
    }
  });

  test("metadata array from getNodeListBetweenRange(skipEmpty=true) aligns with units", () => {
    const doc = makeDoc(
      h(2, "Title"),
      p(""),
      p("Paragraph one"),
      p(""),
      p("Paragraph two"),
    );

    const nodeList = getNodeListBetweenRange(
      0, doc.nodeSize, doc, DIFFABLE, NON_DIFFABLE,
      true, // skipEmpty - must be true to align with block-runner
      false,
    );
    const units = getUnitsInRange(doc, 0, doc.content.size, ["heading", "paragraph"]);

    expect(nodeList.length).toBe(units.length);
    expect(units.length).toBe(3); // "Title", "Paragraph one", "Paragraph two"

    for (let i = 0; i < nodeList.length; i++) {
      expect(nodeList[i].text).toBe(units[i].text);
      expect(nodeList[i].from).toBe(units[i].from + 1);
    }
  });
});
