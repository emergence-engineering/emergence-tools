import { stringSimilarity } from "string-similarity-js";

import { AtLeastOne } from "./utils/typeHelpers";

export interface NodeHelper<T> {
  body: string;
  index: number;
  node: T;
  similarity: Map<number, number>;
}

type SimilarityFromNode<T> = (node1: T, node2: T) => number;
export type SimilarityFromString = (string1: string, string2: string) => number;

interface SimilarityOptions<T> {
  fromNode?: SimilarityFromNode<T>;
  fromString?: SimilarityFromString;
}

interface AlgoProps<T> {
  bodyExtractor: (node: T) => string;
  insertDeleteWeight?: number; // default -1 a good value is between -1 and 1
  leftSideNodes: T[];
  rightSideNodes: T[];
  similarity: AtLeastOne<SimilarityOptions<T>>;
}

export interface NodePairing<T> {
  leftNode?: NodeHelper<T>;
  rightNode?: NodeHelper<T>;
  score: number;
}

// Initialize scoring matrix and traceback matrix
const initializeMatrices = (
  leftSeq: unknown[],
  rightSeq: unknown[],
): {
  scoreMatrix: number[][];
  tracebackMatrix: (string | null)[][];
} => {
  const leftSeqLen = leftSeq.length + 1;
  const rightSeqLen = rightSeq.length + 1;

  const scoreMatrix: number[][] = Array.from({ length: leftSeqLen }, () =>
    Array<number>(rightSeqLen).fill(0),
  );
  const tracebackMatrix = Array.from({ length: leftSeqLen }, () =>
    Array<string | null>(rightSeqLen).fill(null),
  );

  return { scoreMatrix, tracebackMatrix };
};

const getSimilarity = <T>(
  leftNode: NodeHelper<T>,
  rightNode: NodeHelper<T>,
  similarity: AtLeastOne<SimilarityOptions<T>>,
): number => {
  const memorizedSimilarity = leftNode.similarity.get(rightNode.index);
  if (memorizedSimilarity !== undefined) {
    return memorizedSimilarity;
  }
  if (similarity.fromString) {
    const sim = similarity.fromString(leftNode.body, rightNode.body);
    leftNode.similarity.set(rightNode.index, sim);
    return sim;
  }

  if (similarity.fromNode) {
    const sim = similarity.fromNode(leftNode.node, rightNode.node);
    leftNode.similarity.set(rightNode.index, sim);
    return sim;
  }

  throw new Error("Similarity function not provided");
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const renderMatrix = (matrix: unknown[][]): void => {
  // Calculate the maximum length of strings in each column
  const maxLengths = matrix[0].map((_, i) =>
    Math.max(...matrix.map((row) => String(row[i]).length)),
  );

  // Create an array of padded rows
  const paddedRows = matrix.map((row) =>
    row.map((str, i) => String(str).padEnd(maxLengths[i])).join(" "),
  );

  // Log the padded rows to the console as a single string
  console.log(paddedRows.join("\n"));
};

export const stringNodePairing = <T>(
  algoProps: AlgoProps<T>,
): NodePairing<T>[] => {
  // init params
  const { bodyExtractor, leftSideNodes, rightSideNodes, similarity } =
    algoProps;
  const insertDeleteWeight = algoProps.insertDeleteWeight ?? -1;

  //we reverse the arrays to make the algorithm work from top to bottom when we backtrack
  const leftSeq = leftSideNodes
    .map((node, index) => ({
      body: bodyExtractor(node),
      index,
      node,
      similarity: new Map<number, number>(),
    }))
    .reverse();

  const rightSeq = rightSideNodes
    .map((node, index) => ({
      body: bodyExtractor(node),
      index,
      node,
      similarity: new Map<number, number>(),
    }))
    .reverse();

  const { scoreMatrix, tracebackMatrix } = initializeMatrices(
    leftSeq,
    rightSeq,
  );

  // fill matrices
  for (let i = 1; i <= leftSeq.length; i++) {
    for (let j = 1; j <= rightSeq.length; j++) {
      const match =
        scoreMatrix[i - 1][j - 1] +
        getSimilarity(leftSeq[i - 1], rightSeq[j - 1], similarity);
      const deleteGap = scoreMatrix[i - 1][j] + insertDeleteWeight;
      const insertGap = scoreMatrix[i][j - 1] + insertDeleteWeight;

      const maxScore = Math.max(match, deleteGap, insertGap);
      scoreMatrix[i][j] = maxScore;

      if (maxScore === match) {
        tracebackMatrix[i][j] = "DIAG";
      } else if (maxScore === deleteGap) {
        tracebackMatrix[i][j] = "UP";
      } else {
        tracebackMatrix[i][j] = "LEFT";
      }
    }
  }

  //uncomment these for text debugging
  //renderMatrix(scoreMatrix);
  //renderMatrix(tracebackMatrix);

  // traceback
  let i = leftSeq.length;
  let j = rightSeq.length;
  const alignedNodes: NodePairing<T>[] = [];

  while (i > 0 || j > 0) {
    if (tracebackMatrix[i][j] === "DIAG") {
      alignedNodes.push({
        leftNode: leftSeq[i - 1],
        rightNode: rightSeq[j - 1],
        score: scoreMatrix[i][j],
      });
      i--;
      j--;
    } else if (tracebackMatrix[i][j] === "UP" || j === 0) {
      alignedNodes.push({
        leftNode: leftSeq[i - 1],
        rightNode: undefined,
        score: scoreMatrix[i][j],
      });
      i--;
    } else {
      alignedNodes.push({
        leftNode: undefined,
        rightNode: rightSeq[j - 1],
        score: scoreMatrix[i][j],
      });
      j--;
    }
  }

  return alignedNodes;
};

export const defaultStringSimilarity = stringSimilarity;
