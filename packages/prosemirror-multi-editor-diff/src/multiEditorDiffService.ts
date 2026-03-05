import {
  ActionType,
  RunnerState,
  RunnerStatus,
  ClearAction,
  InitAction,
  UpdateContextAction,
  ProcessingUnit,
} from "@emergence-engineering/prosemirror-block-runner";
import { Node } from "prosemirror-model";
import { EditorView } from "prosemirror-view";

import {
  getOtherNode,
  MultiEditorDiffVisuAdditionalNodeData,
  multiEditorDiffVisuPluginKey,
  MultiEditorDiffVisuResponse,
  MultiEditorDiffVisuState,
} from "./multiEditorDiffVisu";
import {
  multiEditorDiffVisuHelperPlugin,
  MultiEditorDiffVisuHelperPluginKey,
} from "./multiEditorDiffVisuTransactionHelper";
import {
  defaultStringSimilarity,
  NodePairing,
  stringNodePairing,
} from "./stringNodePairing";
import {
  DEFAULT_DIFFABLE_NODE_TYPES,
  DEFAULT_NON_DIFFABLE_NODE_TYPES,
  isSameVersion,
  MultiEditorDiffConfig,
  UuidWithVersion,
} from "./types";
import {
  getNodeListBetweenRange,
  NodeHelperObj,
} from "./utils/getNodeListBetweenRange";
import { getParentTypeList } from "./utils/parentTypeList";

export type MultiEditorStateHolderIdType = "left" | "right";

type NodeAdditionalDataSideHelperFn = (
  side: MultiEditorStateHolderIdType,
  sideNode: (pair: NodePairing<Node>) => Node | undefined,
) => (node: NodeHelperObj) => MultiEditorDiffVisuAdditionalNodeData;

type EditorWithIds = {
  view: EditorView;
  scrollerDivRef: { current: HTMLDivElement | null };
  uuidWithVersion: UuidWithVersion;
};

export const multiEditorDiffStateHolder = (config?: MultiEditorDiffConfig) => {
  const diffableNodeTypes =
    config?.diffableNodeTypes ?? DEFAULT_DIFFABLE_NODE_TYPES;
  const nonDiffableNodeTypes =
    config?.nonDiffableNodeTypes ?? DEFAULT_NON_DIFFABLE_NODE_TYPES;

  let editors: EditorWithIds[] = [];
  let leftEditor: undefined | EditorWithIds = undefined;
  let rightEditor: undefined | EditorWithIds = undefined;

  const sendClearTransaction = (editorId: MultiEditorStateHolderIdType) => {
    const view =
      editorId === "left" ? leftEditor?.view : rightEditor?.view;
    if (!view) return;
    const meta: ClearAction = {
      type: ActionType.CLEAR,
    };
    const tr = view.state.tr.setMeta(multiEditorDiffVisuPluginKey, meta);
    view.dispatch(tr);
  };

  const findEditor = (uuidWithVersion: UuidWithVersion) => {
    return uuidWithVersion.versionId === null
      ? editors.reduce(
          (max: undefined | EditorWithIds, current: EditorWithIds) => {
            if (current.uuidWithVersion.uuid === uuidWithVersion.uuid) {
              if (
                max === undefined ||
                (current.uuidWithVersion.versionId ?? 0) >
                  (max.uuidWithVersion.versionId ?? 0)
              ) {
                return current;
              }
            }
            return max;
          },
          undefined,
        )
      : editors.find((e) => isSameVersion(e.uuidWithVersion, uuidWithVersion));
  };

  const addEditor = (
    uuidWithVersion: UuidWithVersion,
    view: EditorView,
    scrollerDivRef: { current: HTMLDivElement | null },
  ) => {
    editors = editors.filter(
      (e) => !isSameVersion(e.uuidWithVersion, uuidWithVersion),
    );
    editors.push({ uuidWithVersion, view, scrollerDivRef });
  };

  const selectEditor = (
    id: MultiEditorStateHolderIdType,
    uuidWithVersion: UuidWithVersion,
  ) => {
    const selected = findEditor(uuidWithVersion);
    if (!selected) {
      return;
    }
    sendClearTransaction("left");
    sendClearTransaction("right");
    if (id === "left") {
      leftEditor = selected;
    } else {
      rightEditor = selected;
    }
  };

  const scrollChanged = (topPos: number, uuidWithVersion: UuidWithVersion) => {
    const selected = findEditor(uuidWithVersion);
    if (leftEditor && rightEditor && selected) {
      if (isSameVersion(leftEditor.uuidWithVersion, selected.uuidWithVersion)) {
        const currentDivRef = rightEditor.scrollerDivRef.current;
        if (currentDivRef) {
          currentDivRef.scrollTop = topPos;
        }
      } else if (
        isSameVersion(rightEditor.uuidWithVersion, selected.uuidWithVersion)
      ) {
        const currentDivRef = leftEditor.scrollerDivRef.current;
        if (currentDivRef) {
          currentDivRef.scrollTop = topPos;
        }
      }
    }
  };

  const calcPairings = ():
    | {
        leftSideNodes: NodeHelperObj[];
        nodeAdditionalDataSideHelper: NodeAdditionalDataSideHelperFn;
        pairings: NodePairing<Node>[];
        rightSideNodes: NodeHelperObj[];
      }
    | undefined => {
    if (leftEditor && rightEditor) {
      const leftSideNodeList = getNodeListBetweenRange(
        0,
        leftEditor.view.state.doc.nodeSize,
        leftEditor.view.state.doc,
        diffableNodeTypes,
        nonDiffableNodeTypes,
        true,
        true,
      );
      const leftSideNodes = leftSideNodeList.map((node) => node.node);
      const rightSideNodeList = getNodeListBetweenRange(
        0,
        rightEditor.view.state.doc.nodeSize,
        rightEditor.view.state.doc,
        diffableNodeTypes,
        nonDiffableNodeTypes,
        true,
        true,
      );
      const rightSideNodes = rightSideNodeList.map((node) => node.node);
      const pairings = stringNodePairing({
        bodyExtractor: (node: Node) => node.textContent,
        leftSideNodes,
        rightSideNodes,
        similarity: { fromString: defaultStringSimilarity },
        insertDeleteWeight: 0,
      });
      const nodeAdditionalDataSideHelper =
        (
          side: MultiEditorStateHolderIdType,
          sideNode: (pair: NodePairing<Node>) => Node | undefined,
        ) =>
        (
          nodeHelperObj: NodeHelperObj,
        ): MultiEditorDiffVisuAdditionalNodeData => {
          const { from, node } = nodeHelperObj;
          const firstIdx = pairings.findIndex(
            (pair) => sideNode(pair) === node,
          );
          if (firstIdx === -1) {
            return {
              editorId: side,
              pairs: undefined,
              parentTypeList: [],
            };
          }
          const pairsF = pairings.slice(firstIdx + 1);
          const sIdx = pairsF.findIndex((pair) => sideNode(pair) !== undefined);
          const pairs =
            sIdx === -1
              ? pairings.slice(firstIdx)
              : pairings.slice(firstIdx, firstIdx + sIdx + 1);
          return {
            editorId: side,
            pairs,
            parentTypeList: getParentTypeList(
              side === "left"
                ? leftEditor?.view.state.doc
                : rightEditor?.view.state.doc,
              from,
            ),
          };
        };
      return {
        pairings,
        nodeAdditionalDataSideHelper,
        leftSideNodes: leftSideNodeList,
        rightSideNodes: rightSideNodeList,
      };
    }
    return undefined;
  };

  const sendStateUpdateTransaction = (
    editorId: MultiEditorStateHolderIdType,
    pairings: NodePairing<Node>[],
    leftSideNodes: NodeHelperObj[] | undefined,
    rightSideNodes: NodeHelperObj[] | undefined,
  ) => {
    const view =
      editorId === "left" ? leftEditor?.view : rightEditor?.view;
    if (!view) return;
    const meta: UpdateContextAction<MultiEditorDiffVisuState> = {
      contextState: {
        id: editorId,
        nodePairings: pairings,
        otherEditorView:
          editorId === "left" ? rightEditor?.view : leftEditor?.view,
        nodeListFromOtherEditor:
          editorId === "left" ? rightSideNodes : leftSideNodes,
      },
      type: ActionType.UPDATE_CONTEXT,
    };
    const tr = view.state.tr.setMeta(
      multiEditorDiffVisuPluginKey,
      meta,
    );
    view.dispatch(tr);
  };

  const sendPluginInitTransaction = (
    editorId: MultiEditorStateHolderIdType,
    nodeAdditionalDataSideHelper: NodeAdditionalDataSideHelperFn,
  ) => {
    const view =
      editorId === "left" ? leftEditor?.view : rightEditor?.view;
    if (!view) return;

    // Get node list for this side to compute metadata array
    // skipEmpty must be true to align with block-runner's getUnitsInRange
    // which always skips empty nodes (text.trim().length > 0)
    const nodeList = getNodeListBetweenRange(
      0,
      view.state.doc.nodeSize,
      view.state.doc,
      diffableNodeTypes,
      nonDiffableNodeTypes,
      true,
      true,
    );

    const metadataFactory = nodeAdditionalDataSideHelper(editorId, (pair) =>
      editorId === "left" ? pair.leftNode?.node : pair.rightNode?.node,
    );
    const metadataArray = nodeList.map(metadataFactory);

    const meta: InitAction<MultiEditorDiffVisuAdditionalNodeData> = {
      onlySelection: false,
      metadata: {
        array: metadataArray,
      },
      type: ActionType.INIT,
    };
    const tr = view.state.tr.setMeta(multiEditorDiffVisuPluginKey, meta);
    view.dispatch(tr);
  };

  const updatePairingsCallback = () => {
    const helperResponse = calcPairings();
    if (!helperResponse) return;
    const {
      leftSideNodes,
      nodeAdditionalDataSideHelper,
      pairings,
      rightSideNodes,
    } = helperResponse;
    sendClearTransaction("left");
    sendClearTransaction("right");
    sendStateUpdateTransaction("left", pairings, leftSideNodes, rightSideNodes);
    sendStateUpdateTransaction(
      "right",
      pairings,
      leftSideNodes,
      rightSideNodes,
    );
    sendPluginInitTransaction("left", nodeAdditionalDataSideHelper);
    sendPluginInitTransaction("right", nodeAdditionalDataSideHelper);
  };

  const handleToggleEvent = (
    sourceEditorId: MultiEditorStateHolderIdType,
    pos: number,
  ) => {
    if (!leftEditor || !rightEditor) return;
    const sourceView =
      sourceEditorId === "left" ? leftEditor.view : rightEditor.view;
    const destView =
      sourceEditorId === "left" ? rightEditor.view : leftEditor.view;

    const sourcePluginState = multiEditorDiffVisuPluginKey.getState(
      sourceView.state,
    ) as RunnerState<
      MultiEditorDiffVisuResponse,
      MultiEditorDiffVisuState,
      MultiEditorDiffVisuAdditionalNodeData
    > | undefined;
    if (
      !sourcePluginState ||
      sourcePluginState.status === RunnerStatus.IDLE
    ) {
      return undefined;
    }
    const fixedPos = pos + 1;
    const sourceUnit = sourcePluginState.unitsInProgress?.find((unit) => {
      return unit.from <= fixedPos && unit.to >= fixedPos;
    });
    const sourcePair = sourceUnit?.metadata.pairs?.[0];
    if (!sourcePair) return;
    const destNodeIndex = getOtherNode(sourceEditorId, sourcePair)?.index;
    if (!destNodeIndex) return;
    const destPluginState = multiEditorDiffVisuPluginKey.getState(
      destView.state,
    ) as RunnerState<
      MultiEditorDiffVisuResponse,
      MultiEditorDiffVisuState,
      MultiEditorDiffVisuAdditionalNodeData
    > | undefined;
    if (
      !destPluginState ||
      destPluginState.status === RunnerStatus.IDLE
    ) {
      return undefined;
    }
    const destUnit = destPluginState.unitsInProgress?.find((unit) => {
      const destPair = unit?.metadata.pairs?.[0];
      if (!destPair) return false;
      return getOtherNode(sourceEditorId, destPair)?.index === destNodeIndex;
    });
    if (!destUnit) return;

    config?.onToggleCollapsible?.(destView, destUnit.from - 1, false);

    setTimeout(() => {
      destView.dispatch(destView.state.tr);
    }, 0);
  };

  const switchShowDiff = async (value: boolean) => {
    if (leftEditor && rightEditor) {
      if (value) {
        const helperResponse = calcPairings();
        if (!helperResponse) return;
        const {
          leftSideNodes,
          nodeAdditionalDataSideHelper,
          pairings,
          rightSideNodes,
        } = helperResponse;

        // Register helper plugins via view
        const leftHelperPlugin = multiEditorDiffVisuHelperPlugin(
          {
            handleToggleEvent,
            otherEditorId: "right",
            otherEditorView: rightEditor.view,
            updatePairingsCallback,
          },
          config,
        );
        const rightHelperPlugin = multiEditorDiffVisuHelperPlugin(
          {
            handleToggleEvent,
            otherEditorId: "left",
            otherEditorView: leftEditor.view,
            updatePairingsCallback,
          },
          config,
        );

        // Add plugins via reconfigure
        const leftPlugins = [...leftEditor.view.state.plugins, leftHelperPlugin];
        leftEditor.view.updateState(
          leftEditor.view.state.reconfigure({ plugins: leftPlugins }),
        );
        const rightPlugins = [...rightEditor.view.state.plugins, rightHelperPlugin];
        rightEditor.view.updateState(
          rightEditor.view.state.reconfigure({ plugins: rightPlugins }),
        );

        sendStateUpdateTransaction(
          "left",
          pairings,
          leftSideNodes,
          rightSideNodes,
        );
        sendStateUpdateTransaction(
          "right",
          pairings,
          leftSideNodes,
          rightSideNodes,
        );
        sendPluginInitTransaction("left", nodeAdditionalDataSideHelper);
        sendPluginInitTransaction("right", nodeAdditionalDataSideHelper);
      } else {
        // Remove helper plugins via reconfigure
        [leftEditor.view, rightEditor.view].forEach((view: EditorView) => {
          const helperPlugin = MultiEditorDiffVisuHelperPluginKey.get(view.state);
          if (helperPlugin) {
            const filteredPlugins = view.state.plugins.filter(
              (p) => p !== helperPlugin,
            );
            view.updateState(
              view.state.reconfigure({ plugins: filteredPlugins }),
            );
          }
        });
        sendClearTransaction("left");
        sendClearTransaction("right");
      }
    }
  };

  return {
    addEditor,
    selectEditor,
    scrollChanged,
    switchShowDiff,
    updatePairingsCallback,
  };
};

export type MultiEditorDiffStateHolder = ReturnType<
  typeof multiEditorDiffStateHolder
>;
