import {
  NodeHelper,
  NodePairing,
  SimilarityFromString,
  stringNodePairing,
} from "../stringNodePairing";

type TextNode = { name: string };

const getAlignmentStrings = (nodePairings: NodePairing<TextNode>[]) => {
  let leftAlignment = "";
  let rightAlignment = "";
  nodePairings.forEach((nodePairing) => {
    leftAlignment += nodePairing.leftNode?.index ?? "-";
    rightAlignment += nodePairing.rightNode?.index ?? "-";
  });
  return { leftAlignment, rightAlignment };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const printPairings = (nodePairings: NodePairing<TextNode>[]) => {
  const leftAlignment: string[] = [];
  const rightAlignment: string[] = [];
  const formatPairing = (
    node: NodeHelper<TextNode> | undefined,
    otherNode: NodeHelper<TextNode> | undefined
  ) => {
    if (node) {
      if (otherNode) {
        return `${node.index}:${node.body}`.padEnd(
          otherNode.index.toString().length + 1 + otherNode.body.length
        );
      }
      return `${node.index}:${node.body}`;
    } else {
      if (otherNode) {
        return "".padEnd(
          otherNode.index.toString().length + 1 + otherNode.body.length,
          "-"
        );
      }
      return "-";
    }
  };
  nodePairings.forEach((nodePairing) => {
    leftAlignment.push(
      formatPairing(nodePairing.leftNode, nodePairing.rightNode)
    );
    rightAlignment.push(
      formatPairing(nodePairing.rightNode, nodePairing.leftNode)
    );
  });

  console.log(leftAlignment.join(" | ") + "\n" + rightAlignment.join(" | "));
};

const testAlignments = (
  nodePairings: NodePairing<TextNode>[],
  leftExpected: string,
  rightExpected: string
) => {
  const { leftAlignment, rightAlignment } = getAlignmentStrings(nodePairings);
  expect(leftAlignment).toEqual(leftExpected);
  expect(rightAlignment).toEqual(rightExpected);
};

const stringExactMatchSimilarity: SimilarityFromString = (string1, string2) => {
  return string1 === string2 ? 1 : 0;
};

const bodyNameExtractor = (node: { name: string }) => node.name;

describe("stringNodePairing", () => {
  test("simple pairing with no cutoffs", () => {
    // Define some nodes
    const nodes1 = [{ name: "Node 1" }, { name: "Node 2" }, { name: "Node 3" }];
    const nodes2 = [{ name: "Node 3" }, { name: "Node 2" }, { name: "Node 1" }];

    // Call the stringNodePairing function
    const result = stringNodePairing({
      bodyExtractor: bodyNameExtractor,
      leftSideNodes: nodes1,
      rightSideNodes: nodes2,
      similarity: { fromString: stringExactMatchSimilarity },
      insertDeleteWeight: 0,
    });

    // Check the result
    testAlignments(result, "012", "012");
  });

  test("simple pairing with no cutoffs diff size arrays", () => {
    // Define some nodes
    const nodes1 = [
      { name: "Node 10" },
      { name: "Node 12" },
      { name: "Node 2" },
      { name: "Node 30" },
      { name: "Node 10" },
      { name: "Node 10" },
    ];
    const nodes2 = [
      { name: "Node 30" },
      { name: "Node 2" },
      { name: "Node 10" },
      { name: "Node 10" },
    ];

    // Call the stringNodePairing function
    const result = stringNodePairing({
      bodyExtractor: bodyNameExtractor,
      leftSideNodes: nodes1,
      rightSideNodes: nodes2,
      similarity: { fromString: stringExactMatchSimilarity },
      insertDeleteWeight: 0,
    });

    // Check the result
    printPairings(result);
    testAlignments(result, "012345", "0-1-23");
  });
});
