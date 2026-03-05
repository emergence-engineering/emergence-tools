import {
  docToTextWithMapping,
  TextMappingItem,
  textPosToDocPos,
  type MappingOptions,
} from "@emergence-engineering/prosemirror-text-map";
import {
  ActionType,
  blockRunnerPlugin,
  DecorationFactory,
  ProcessingUnit,
  ResultDecoration,
  ResultDecorationSpec,
  RunnerState,
  RunnerStatus,
  UnitProcessor,
  UnitProcessorResult,
  UnitStatus,
  UnitRange,
} from "@emergence-engineering/prosemirror-block-runner";
import { Node } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, EditorView } from "prosemirror-view";
import * as Diff from "diff";

import { MultiEditorStateHolderIdType } from "./multiEditorDiffService";
import { NodeHelper, NodePairing } from "./stringNodePairing";
import { mergeUpNodesWithParents } from "./utils/htmlDom";
import { getParentTypeList } from "./utils/parentTypeList";
import { DEFAULT_DIFFABLE_NODE_TYPES, MultiEditorDiffConfig } from "./types";

export interface NodeListEntry {
  node: Node;
  from: number;
  text: string;
}

export interface MultiEditorDiffVisuResponse {
  diff: Diff.Change[];
  error: undefined;
  nextText: { mapping: TextMappingItem[]; text: string };
  prevText: { mapping: TextMappingItem[]; text: string };
}

export interface MultiEditorDiffVisuState {
  id: MultiEditorStateHolderIdType;
  nodeListFromOtherEditor?: NodeListEntry[];
  nodePairings: NodePairing<Node>[];
  otherEditorView?: EditorView;
  textExtractionOptions?: Partial<MappingOptions>;
}

export interface MultiEditorDiffVisuAdditionalNodeData {
  editorId: MultiEditorStateHolderIdType;
  pairs: NodePairing<Node>[] | undefined;
  parentTypeList: string[];
}

export const multiEditorDiffVisuPluginKey = new PluginKey<
  RunnerState<
    MultiEditorDiffVisuResponse,
    MultiEditorDiffVisuState,
    MultiEditorDiffVisuAdditionalNodeData
  >
>("multiEditorDiffVisuPlugin");

export const getOtherNode = (
  editorId: MultiEditorStateHolderIdType,
  pair: NodePairing<Node>,
): NodeHelper<Node> | undefined => {
  return editorId === "left" ? pair.rightNode : pair.leftNode;
};

export const getThisNode = (
  editorId: MultiEditorStateHolderIdType,
  pair: NodePairing<Node>,
): NodeHelper<Node> | undefined => {
  return editorId === "right" ? pair.rightNode : pair.leftNode;
};

export const setOtherNode = (
  editorId: MultiEditorStateHolderIdType,
  pair: NodePairing<Node>,
  node: NodeHelper<Node>,
): NodePairing<Node> | undefined => {
  if (editorId === "left") {
    return { ...pair, rightNode: node };
  }
  return { ...pair, leftNode: node };
};

export const setThisNode = (
  editorId: MultiEditorStateHolderIdType,
  pair: NodePairing<Node>,
  node: NodeHelper<Node>,
): NodePairing<Node> | undefined => {
  if (editorId === "right") {
    return { ...pair, rightNode: node };
  }
  return { ...pair, leftNode: node };
};

const nodeHeightInclMarginBottom = (node: HTMLElement): number => {
  return (
    node.getBoundingClientRect().height +
    parseFloat(window.getComputedStyle(node).marginBottom)
  );
};

const widgetSpecGenerator = (
  unit: ProcessingUnit<MultiEditorDiffVisuAdditionalNodeData>,
): ResultDecorationSpec<MultiEditorDiffVisuResponse> => {
  return {
    id: {},
    unitId: unit.id,
    originalText: "",
    response: {
      diff: [],
      error: undefined,
      nextText: { text: "", mapping: [] },
      prevText: { text: "", mapping: [] },
    },
  };
};

const createSpacerDecoration = (
  unit: ProcessingUnit<MultiEditorDiffVisuAdditionalNodeData>,
  contextState: MultiEditorDiffVisuState,
) => {
  // block-runner uses from = pos (at node boundary), content starts at from + 1
  const nodeContentFrom = unit.from + 1;

  return Decoration.widget(
    unit.to,
    (view) => {
      const div = document.createElement("div");
      div.setAttribute("skipAtSiblingCheck", "true");
      div.classList.add("multi-editor-diff");
      div.classList.add("empty-rect");

      const thisNodeNode = view.domAtPos(nodeContentFrom).node;
      if (thisNodeNode === null || !(thisNodeNode instanceof HTMLElement))
        return div;

      const nodeListFromOtherEditor = contextState.nodeListFromOtherEditor;
      if (!nodeListFromOtherEditor) return div;

      const nodesToCheck: HTMLElement[] = [];
      unit.metadata.pairs?.forEach((pair) => {
        const otherNode = getOtherNode(unit.metadata.editorId, pair);
        if (otherNode === undefined) return;
        if (contextState.otherEditorView === undefined) return;
        const htmlNode = contextState.otherEditorView.domAtPos(
          nodeListFromOtherEditor[otherNode.index].from,
        ).node;

        if (htmlNode === null) return;
        if (htmlNode instanceof Text) {
          const parent = htmlNode.parentNode;
          if (parent instanceof HTMLElement) {
            nodesToCheck.push(parent);
          }
        } else if (htmlNode instanceof HTMLElement) {
          nodesToCheck.push(htmlNode);
        }
      });

      const mergedNodes = mergeUpNodesWithParents(nodesToCheck);

      const computeAndSetHeight = () => {
        const nodeHeights = mergedNodes.reduce((acc, node) => {
          return nodeHeightInclMarginBottom(node) + acc;
        }, 0);
        const height = nodeHeights - nodeHeightInclMarginBottom(thisNodeNode);
        if (window.getComputedStyle(thisNodeNode).visibility !== "hidden") {
          div.style.height = `${Math.max(height, 0)}px`;
        } else {
          div.style.height = "0px";
        }
      };

      computeAndSetHeight();

      const resObserver = new ResizeObserver(() => {
        computeAndSetHeight();
      });
      const mutationObserver = new MutationObserver(() => {
        if (document.body.contains(div)) {
          return;
        } else {
          resObserver.disconnect();
          mutationObserver.disconnect();
        }
      });
      resObserver.observe(thisNodeNode);
      nodesToCheck.forEach((node) => {
        resObserver.observe(node);
      });
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
      return div;
    },
    { ...widgetSpecGenerator(unit), spacer: true },
  );
};

const renderInlineDecorators = (
  response: MultiEditorDiffVisuResponse,
  unit: ProcessingUnit<MultiEditorDiffVisuAdditionalNodeData>,
) => {
  const decorations: ResultDecoration<MultiEditorDiffVisuResponse>[] = [];
  // block-runner uses from = pos (at node boundary), content starts at from + 1
  const nodeContentFrom = unit.from + 1;

  let posThis = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let posPrev = 0;

  response.diff.forEach((part) => {
    const { added, removed, value } = part;
    if (added) {
      const fromPos =
        nodeContentFrom + textPosToDocPos(posThis, response.nextText.mapping);
      const toPos =
        nodeContentFrom +
        textPosToDocPos(posThis + value.length, response.nextText.mapping);
      const decoration = Decoration.inline(
        fromPos,
        toPos === fromPos ? fromPos + 1 : toPos,
        {
          class:
            unit.metadata.editorId === "left"
              ? "highlight-deletion"
              : "highlight-addition",
        },
        {
          id: {},
          unitId: unit.id,
          originalText: response.nextText.text,
          response,
        } as ResultDecorationSpec<MultiEditorDiffVisuResponse>,
      ) as ResultDecoration<MultiEditorDiffVisuResponse>;
      decorations.push(decoration);
      posThis += value.length;
    } else if (removed) {
      posPrev += value.length;
    } else {
      posThis += value.length;
      posPrev += value.length;
    }
  });

  return decorations;
};

const renderNodeTypeMismatchWidgets = (
  unit: ProcessingUnit<MultiEditorDiffVisuAdditionalNodeData>,
  otherEditorView: EditorView,
  nodeListFromOtherEditor: NodeListEntry[],
) => {
  const decorations: ResultDecoration<MultiEditorDiffVisuResponse>[] = [];
  // block-runner uses from = pos (at node boundary), content starts at from + 1
  const nodeContentFrom = unit.from + 1;

  if (unit.metadata.pairs !== undefined) {
    const otherNode = getOtherNode(
      unit.metadata.editorId,
      unit.metadata.pairs[0],
    );
    const thisNode = getThisNode(
      unit.metadata.editorId,
      unit.metadata.pairs[0],
    );
    if (otherNode !== undefined && thisNode !== undefined) {
      if (otherNode.node.type.name !== thisNode.node.type.name) {
        decorations.push(
          Decoration.widget(
            nodeContentFrom,
            () => {
              const div = document.createElement("div");
              div.classList.add("multi-editor-diff");
              div.classList.add("non-matching-node-type");
              div.innerHTML = "X?1";
              div.setAttribute("skipAtSiblingCheck", "true");
              return div;
            },
            widgetSpecGenerator(unit),
          ) as ResultDecoration<MultiEditorDiffVisuResponse>,
        );
      } else {
        if (otherNode.node.type.name === "heading") {
          if (otherNode.node.attrs.level !== thisNode.node.attrs.level) {
            decorations.push(
              Decoration.widget(
                nodeContentFrom,
                () => {
                  const div = document.createElement("div");
                  div.classList.add("multi-editor-diff");
                  div.classList.add("non-matching-node-level");
                  div.innerHTML = "X?2";
                  div.setAttribute("skipAtSiblingCheck", "true");
                  return div;
                },
                widgetSpecGenerator(unit),
              ) as ResultDecoration<MultiEditorDiffVisuResponse>,
            );
          }
        } else if (otherNode.node.type.name === "paragraph") {
          const otherNodeParentTypeList = getParentTypeList(
            otherEditorView.state.doc,
            nodeListFromOtherEditor[otherNode.index].from,
          );
          if (
            unit.metadata.parentTypeList.length !==
            otherNodeParentTypeList.length
          ) {
            decorations.push(
              Decoration.widget(
                nodeContentFrom,
                () => {
                  const div = document.createElement("div");
                  div.classList.add("multi-editor-diff");
                  div.classList.add("non-matching-node-parent-length");
                  div.innerHTML = "X?3";
                  div.setAttribute("skipAtSiblingCheck", "true");
                  return div;
                },
                widgetSpecGenerator(unit),
              ) as ResultDecoration<MultiEditorDiffVisuResponse>,
            );
          } else {
            const differentParent = unit.metadata.parentTypeList.some(
              (parentType, index) => {
                return parentType !== otherNodeParentTypeList[index];
              },
            );
            if (differentParent) {
              decorations.push(
                Decoration.widget(
                  nodeContentFrom,
                  () => {
                    const div = document.createElement("div");
                    div.classList.add("multi-editor-diff");
                    div.classList.add("non-matching-node-parent-type");
                    div.innerHTML = "X?4";
                    div.setAttribute("skipAtSiblingCheck", "true");
                    return div;
                  },
                  widgetSpecGenerator(unit),
                ) as ResultDecoration<MultiEditorDiffVisuResponse>,
              );
            }
          }
        }
      }
    }
  }
  return decorations;
};

const multiEditorDiffVisuDecorationCreator: DecorationFactory<
  MultiEditorDiffVisuResponse,
  MultiEditorDiffVisuAdditionalNodeData,
  MultiEditorDiffVisuState
> = (
  response: MultiEditorDiffVisuResponse,
  unit: ProcessingUnit<MultiEditorDiffVisuAdditionalNodeData>,
  contextState: MultiEditorDiffVisuState,
): ResultDecoration<MultiEditorDiffVisuResponse>[] => {
  const decorations: ResultDecoration<MultiEditorDiffVisuResponse>[] = [];

  // inline decorators
  decorations.push(...renderInlineDecorators(response, unit));

  if (contextState.otherEditorView && contextState.nodeListFromOtherEditor) {
    // node type mismatch check
    decorations.push(
      ...renderNodeTypeMismatchWidgets(
        unit,
        contextState.otherEditorView,
        contextState.nodeListFromOtherEditor,
      ),
    );
    // spacer rectangle
    const spacerDecoration = createSpacerDecoration(unit, contextState);
    decorations.push(spacerDecoration as ResultDecoration<MultiEditorDiffVisuResponse>);
  }

  return decorations;
};

const multiEditorDiffVisuUnitProcessor: UnitProcessor<
  MultiEditorDiffVisuResponse,
  MultiEditorDiffVisuAdditionalNodeData
> = async (
  view: EditorView,
  unit: ProcessingUnit<MultiEditorDiffVisuAdditionalNodeData>,
): Promise<UnitProcessorResult<MultiEditorDiffVisuResponse>> => {
  // Get textExtractionOptions from contextState
  const pluginState = multiEditorDiffVisuPluginKey.getState(view.state);
  const textExtractionOptions = pluginState?.contextState?.textExtractionOptions;

  return new Promise((resolve) => {
    setTimeout(() => {
      const firstPair = unit.metadata.pairs?.[0];
      const otherNode = (unit.metadata.editorId === "left"
        ? firstPair?.rightNode
        : firstPair?.leftNode
      )?.node;
      const prevText = otherNode
        ? docToTextWithMapping(otherNode, textExtractionOptions ?? {})
        : { text: "", mapping: [] as TextMappingItem[] };

      // Use the text/mapping already extracted by block-runner
      const newText = { text: unit.text, mapping: unit.mapping };

      const diff: Diff.Change[] = Diff.diffWordsWithSpace(
        prevText.text,
        newText.text,
        {
          ignoreCase: false,
        },
      );

      // Normalize deletion-addition orders
      const reorganised: Diff.Change[] = [];
      diff.forEach((part, index) => {
        if (part.removed && index > 0 && diff[index - 1].added) {
          reorganised.pop();
          reorganised.push(part, diff[index - 1]);
        } else {
          reorganised.push(part);
        }
      });

      // Resplit spaces
      const resplitedSpaces: Diff.Change[] = [];
      reorganised.forEach((part) => {
        if (part.added && part.value.length > part.value.trimEnd().length) {
          const keep = resplitedSpaces.pop();
          const addition = resplitedSpaces.pop();
          if (
            addition &&
            keep &&
            addition.added &&
            !keep.added &&
            !keep.removed &&
            keep.value.length === 1 &&
            keep.value.trim().length === 0
          ) {
            resplitedSpaces.push(
              {
                ...addition,
                value: addition.value + keep.value,
                ...(addition.count !== undefined && keep.count !== undefined
                  ? { count: addition.count + keep.count }
                  : {}),
              },
              {
                ...part,
                value: part.value.slice(0, part.value.length - 1),
                ...(part.count !== undefined ? { count: part.count - 1 } : {}),
              },
              {
                ...keep,
                value: part.value[part.value.length - 1],
                count: 1,
              },
            );
          } else {
            addition ? resplitedSpaces.push(addition) : {};
            keep ? resplitedSpaces.push(keep) : {};
            resplitedSpaces.push(part);
          }
        } else if (
          !part.added &&
          !part.removed &&
          part.value.length === 1 &&
          part.value.trim().length === 0
        ) {
          const addition = resplitedSpaces.pop();
          const keep = resplitedSpaces.pop();
          if (
            keep &&
            addition &&
            addition.added &&
            !keep.added &&
            !keep.removed &&
            addition.value.length > addition.value.trimStart().length
          ) {
            resplitedSpaces.push(
              {
                ...keep,
                value: keep.value + part.value.slice(0, 1),
                ...(keep.count !== undefined ? { count: keep.count + 1 } : {}),
              },
              {
                ...addition,
                value:
                  addition.value.slice(1, addition.value.length) + part.value,
                ...(addition.count !== undefined
                  ? { count: addition.count }
                  : {}),
              },
              {
                ...addition,
                value: "",
                count: 0,
              },
            );
          } else {
            keep ? resplitedSpaces.push(keep) : {};
            addition ? resplitedSpaces.push(addition) : {};
            resplitedSpaces.push(part);
          }
        } else {
          resplitedSpaces.push(part);
        }
      });

      // Regroup consecutive same-type changes
      const diffRegroupped: Diff.Change[] = [];
      for (const part of resplitedSpaces) {
        const dropped = diffRegroupped.pop();
        if (
          dropped === undefined ||
          dropped.added !== part.added ||
          dropped.removed !== part.removed
        ) {
          if (dropped !== undefined) {
            diffRegroupped.push(dropped);
          }
          diffRegroupped.push(part);
        } else {
          diffRegroupped.push({
            ...part,
            value: dropped.value + part.value,
            ...(part.count !== undefined && dropped.count !== undefined
              ? {
                  count: dropped.count + part.count,
                }
              : {}),
          });
        }
      }

      resolve({
        data: {
          diff: diffRegroupped,
          error: undefined,
          nextText: newText,
          prevText,
        },
      });
    }, 10);
  });
};

const loadingWidgetFactory = (
  unit: ProcessingUnit<MultiEditorDiffVisuAdditionalNodeData>,
): Decoration | undefined => {
  if (
    unit.status === UnitStatus.PROCESSING ||
    unit.status === UnitStatus.QUEUED ||
    unit.status === UnitStatus.WAITING
  ) {
    return Decoration.widget(
      unit.from + 1,
      () => {
        const span = document.createElement("span");
        span.classList.add("multi-editor-diff", "loading-icon");
        span.setAttribute("skipAtSiblingCheck", "true");
        return span;
      },
      { id: {}, unitId: unit.id, originalText: "", response: undefined },
    );
  }
  return undefined;
};

export const startingState: MultiEditorDiffVisuState = {
  id: "left",
  nodePairings: [],
  otherEditorView: undefined,
};

export const createMultiEditorDiffVisuPlugin = (config?: MultiEditorDiffConfig): Plugin => {
  return blockRunnerPlugin<
    MultiEditorDiffVisuResponse,
    MultiEditorDiffVisuState,
    MultiEditorDiffVisuAdditionalNodeData
  >({
    pluginKey: multiEditorDiffVisuPluginKey,
    unitProcessor: multiEditorDiffVisuUnitProcessor,
    decorationFactory: multiEditorDiffVisuDecorationCreator,
    widgetFactory: loadingWidgetFactory,
    initialContextState: startingState,
    options: {
      nodeTypes: Array.from(config?.diffableNodeTypes ?? DEFAULT_DIFFABLE_NODE_TYPES),
      textExtractionOptions: config?.textExtractionOptions,
      dirtyHandling: {
        shouldRecalculate: true,
        debounceDelay: 100,
      },
    },
  });
};
