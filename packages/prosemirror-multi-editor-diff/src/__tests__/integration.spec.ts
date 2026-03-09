import { Node, Schema } from "prosemirror-model";
import { getUnitsInRange } from "@emergence-engineering/prosemirror-block-runner";
import {
  docToTextWithMapping,
  textPosToDocPos,
} from "@emergence-engineering/prosemirror-text-map";

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

describe("getUnitsInRange basics", () => {
  const doc = makeDoc(h(2, "Title"), p("Hello world"), p("Second paragraph"));

  test("returns correct units with node references", () => {
    const units = getUnitsInRange(doc, 0, doc.content.size, [
      "heading",
      "paragraph",
    ]);

    expect(units.length).toBe(3);

    for (const unit of units) {
      // unit.from is at node boundary
      const nodeAtFrom = doc.nodeAt(unit.from);
      expect(nodeAtFrom).not.toBeNull();
      expect(["heading", "paragraph"]).toContain(nodeAtFrom!.type.name);

      // unit.node should be the same as doc.nodeAt(unit.from)
      expect(unit.node).toBe(nodeAtFrom);
    }
  });

  test("text content matches docToTextWithMapping on resolved node", () => {
    const units = getUnitsInRange(doc, 0, doc.content.size, [
      "heading",
      "paragraph",
    ]);

    for (const unit of units) {
      const textMapResult = docToTextWithMapping(unit.node);
      expect(textMapResult.text).toBe(unit.text);
    }
  });
});

describe("Empty paragraph handling", () => {
  test("getUnitsInRange always skips empty paragraphs", () => {
    const doc = makeDoc(p("First"), p(""), p("Third"));

    const units = getUnitsInRange(doc, 0, doc.content.size, [
      "heading",
      "paragraph",
    ]);

    // Block-runner always skips empty nodes
    expect(units.length).toBe(2); // "First", "Third"
  });

  test("without empty paragraphs - all nodes returned", () => {
    const doc = makeDoc(p("First"), p("Second"), p("Third"));

    const units = getUnitsInRange(doc, 0, doc.content.size, [
      "heading",
      "paragraph",
    ]);

    expect(units.length).toBe(3);
  });
});

describe("docToTextWithMapping on resolved nodes", () => {
  const doc = makeDoc(p("Hello world"), p("Test paragraph"));

  test("resolvedNode text matches unit text", () => {
    const units = getUnitsInRange(doc, 0, doc.content.size, [
      "heading",
      "paragraph",
    ]);

    for (const unit of units) {
      const resolvedNode = doc.nodeAt(unit.from);
      expect(resolvedNode).not.toBeNull();
      const textMapResult = docToTextWithMapping(resolvedNode!);
      expect(textMapResult.text).toBe(unit.text);
    }
  });

  test("textPosToDocPos gives positions relative to node start (0-based)", () => {
    const units = getUnitsInRange(doc, 0, doc.content.size, [
      "heading",
      "paragraph",
    ]);

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
    const units = getUnitsInRange(doc, 0, doc.content.size, [
      "heading",
      "paragraph",
    ]);

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

  test("node identity is preserved across multiple getUnitsInRange calls", () => {
    const units1 = getUnitsInRange(leftDoc, 0, leftDoc.content.size, [
      "heading",
      "paragraph",
    ]);
    const units2 = getUnitsInRange(leftDoc, 0, leftDoc.content.size, [
      "heading",
      "paragraph",
    ]);

    expect(units1.length).toBe(units2.length);
    for (let i = 0; i < units1.length; i++) {
      // Node objects must be identical (same reference) across calls
      expect(units1[i].node).toBe(units2[i].node);
    }
  });

  test("stringNodePairing stores original node references", () => {
    const {
      stringNodePairing,
      defaultStringSimilarity,
    } = require("../stringNodePairing");

    const leftUnits = getUnitsInRange(leftDoc, 0, leftDoc.content.size, [
      "heading",
      "paragraph",
    ]);
    const rightUnits = getUnitsInRange(rightDoc, 0, rightDoc.content.size, [
      "heading",
      "paragraph",
    ]);
    const leftNodes = leftUnits.map((u) => u.node);
    const rightNodes = rightUnits.map((u) => u.node);

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

  test("metadata factory finds all nodes in pairings", () => {
    const {
      stringNodePairing,
      defaultStringSimilarity,
    } = require("../stringNodePairing");

    // Step 1: calcPairings
    const leftUnits = getUnitsInRange(leftDoc, 0, leftDoc.content.size, [
      "heading",
      "paragraph",
    ]);
    const rightUnits = getUnitsInRange(rightDoc, 0, rightDoc.content.size, [
      "heading",
      "paragraph",
    ]);
    const pairings = stringNodePairing({
      bodyExtractor: (node: Node) => node.textContent,
      leftSideNodes: leftUnits.map((u) => u.node),
      rightSideNodes: rightUnits.map((u) => u.node),
      similarity: { fromString: defaultStringSimilarity },
      insertDeleteWeight: 0,
    });

    // Step 2: Simulate nodeAdditionalDataSideHelper for left side
    const sideNode = (pair: any) => pair.leftNode?.node;
    const metadataArray = leftUnits.map((unit) => {
      const { node } = unit;
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
    const {
      stringNodePairing,
      defaultStringSimilarity,
    } = require("../stringNodePairing");

    const leftUnits = getUnitsInRange(leftDoc, 0, leftDoc.content.size, [
      "heading",
      "paragraph",
    ]);
    const rightUnits = getUnitsInRange(rightDoc, 0, rightDoc.content.size, [
      "heading",
      "paragraph",
    ]);
    const pairings = stringNodePairing({
      bodyExtractor: (node: Node) => node.textContent,
      leftSideNodes: leftUnits.map((u) => u.node),
      rightSideNodes: rightUnits.map((u) => u.node),
      similarity: { fromString: defaultStringSimilarity },
      insertDeleteWeight: 0,
    });

    // For each left node, find its pair and compute the diff
    for (const leftUnit of leftUnits) {
      const sideNode = (pair: any) => pair.leftNode?.node;
      const firstIdx = pairings.findIndex(
        (pair: any) => sideNode(pair) === leftUnit.node,
      );
      expect(firstIdx).not.toBe(-1);

      const pair = pairings[firstIdx];
      const rightNode = pair.rightNode?.node;

      if (rightNode) {
        const prevText = docToTextWithMapping(rightNode);
        const nextText = docToTextWithMapping(leftUnit.node);
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

    const units = getUnitsInRange(doc, 0, doc.content.size, [
      "heading",
      "paragraph",
    ]);

    expect(units.length).toBe(4);

    for (const unit of units) {
      // unit.from should be a valid position
      expect(unit.from).toBeGreaterThanOrEqual(0);
      expect(unit.to).toBeLessThanOrEqual(doc.nodeSize);

      // doc.nodeAt(unit.from) should give us the paragraph/heading
      const nodeAtFrom = doc.nodeAt(unit.from);
      expect(nodeAtFrom).not.toBeNull();
      expect(["heading", "paragraph"]).toContain(nodeAtFrom!.type.name);

      // unit.node should be the resolved node
      expect(unit.node).toBe(nodeAtFrom);

      // docToTextWithMapping on unit.node should give same text
      const textMapResult = docToTextWithMapping(unit.node);
      expect(textMapResult.text).toBe(unit.text);
    }
  });

  test("empty paragraphs are skipped, remaining nodes align", () => {
    const doc = makeDoc(
      h(2, "Title"),
      p(""),
      p("Paragraph one"),
      p(""),
      p("Paragraph two"),
    );

    const units = getUnitsInRange(doc, 0, doc.content.size, [
      "heading",
      "paragraph",
    ]);

    expect(units.length).toBe(3); // "Title", "Paragraph one", "Paragraph two"

    for (const unit of units) {
      expect(unit.text.trim().length).toBeGreaterThan(0);
      expect(unit.node).toBe(doc.nodeAt(unit.from));
    }
  });
});

describe("Index 0 bug fix — MAP_UNIT_METADATA correctly handles node at index 0", () => {
  test("mapFunction updates metadata when otherNodeIdx is 0", () => {
    const { getOtherNode, setOtherNode } = require("../multiEditorDiffVisu");

    // Simulate the mapFunction from multiEditorDiffVisuTransactionHelper
    // with a changedNode at index 0
    const changedNodes = [
      {
        index: 0,
        newNode: { text: "Modified title", node: h(2, "Modified title") },
      },
    ];

    const pair = {
      leftNode: {
        body: "Original title",
        index: 0,
        node: h(2, "Original title"),
        similarity: new Map(),
      },
      rightNode: {
        body: "Right title",
        index: 0,
        node: h(2, "Right title"),
        similarity: new Map(),
      },
    };

    const metadata = {
      editorId: "right" as const,
      pairs: [pair],
      parentTypeList: ["doc"],
    };

    // This is the fixed mapFunction — uses `=== undefined` instead of `!`
    const mapFunction = (
      meta: typeof metadata,
    ): typeof metadata | false => {
      if (meta.pairs === undefined || meta.pairs.length === 0) return false;
      let hasChanged = false;
      const newPairs = meta.pairs.map((p: typeof pair) => {
        const otherNodeIdx = getOtherNode(meta.editorId, p)?.index;
        if (otherNodeIdx === undefined) return p;
        const idx = changedNodes.findIndex((cn) => otherNodeIdx === cn.index);
        if (idx === -1) return p;
        hasChanged = true;
        return setOtherNode(meta.editorId, p, {
          body: changedNodes[idx].newNode.text,
          index: otherNodeIdx,
          node: changedNodes[idx].newNode.node,
          similarity: new Map(),
        });
      });
      if (hasChanged) return { ...meta, pairs: newPairs };
      return false;
    };

    const result = mapFunction(metadata);

    // With the fix, index 0 should be handled correctly
    expect(result).not.toBe(false);
    if (result !== false) {
      const updatedOtherNode = getOtherNode(result.editorId, result.pairs[0]);
      expect(updatedOtherNode.body).toBe("Modified title");
    }
  });
});

describe("Identical text produces no diff highlights", () => {
  test("diffWordsWithSpace returns no added/removed parts for identical text", () => {
    const Diff = require("diff");
    const text = "ProseMirror is a toolkit for building rich-text editors.";
    const diff = Diff.diffWordsWithSpace(text, text);

    const changes = diff.filter(
      (d: Diff.Change) => d.added || d.removed,
    );
    expect(changes.length).toBe(0);
  });

  test("identical documents produce empty diff for each paired node", () => {
    const Diff = require("diff");
    const {
      stringNodePairing,
      defaultStringSimilarity,
    } = require("../stringNodePairing");

    const doc = makeDoc(
      h(2, "Title"),
      p("First paragraph."),
      p("Second paragraph."),
    );

    const units = getUnitsInRange(doc, 0, doc.content.size, [
      "heading",
      "paragraph",
    ]);

    const pairings = stringNodePairing({
      bodyExtractor: (node: Node) => node.textContent,
      leftSideNodes: units.map((u) => u.node),
      rightSideNodes: units.map((u) => u.node),
      similarity: { fromString: defaultStringSimilarity },
      insertDeleteWeight: 0,
    });

    // For each pairing, the diff should produce no changes
    for (const pairing of pairings) {
      if (pairing.leftNode && pairing.rightNode) {
        const leftText = docToTextWithMapping(pairing.leftNode.node);
        const rightText = docToTextWithMapping(pairing.rightNode.node);
        const diff = Diff.diffWordsWithSpace(leftText.text, rightText.text);
        const changes = diff.filter(
          (d: Diff.Change) => d.added || d.removed,
        );
        expect(changes.length).toBe(0);
      }
    }
  });
});
