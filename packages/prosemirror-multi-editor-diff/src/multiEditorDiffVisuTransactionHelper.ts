import {
  Action,
  ActionType,
  MapUnitMetadataAction,
  RunnerState,
  RunnerStatus,
  UpdateContextAction,
  getUnitsInRange,
} from "@emergence-engineering/prosemirror-block-runner";
import { Plugin, PluginKey } from "prosemirror-state";
import { DecorationSet, EditorView } from "prosemirror-view";

import { MultiEditorStateHolderIdType } from "./multiEditorDiffService";
import {
  getOtherNode,
  getThisNode,
  MultiEditorDiffVisuAdditionalNodeData,
  multiEditorDiffVisuPluginKey,
  MultiEditorDiffVisuResponse,
  MultiEditorDiffVisuState,
  NodeListEntry,
  setOtherNode,
  setThisNode,
  startingState,
} from "./multiEditorDiffVisu";
import { DEFAULT_DIFFABLE_NODE_TYPES, MultiEditorDiffConfig } from "./types";
import { getParentTypeList } from "./utils/parentTypeList";
import { nonEmpty } from "./utils/typeHelpers";

interface MultiEditorDiffPluginState {
  decorations: DecorationSet;
  id: MultiEditorStateHolderIdType;
  referenceVersion: Node | undefined;
  show: boolean;
}

interface MultiEditorDiffVisuHelperPluginProps {
  handleToggleEvent: (
    editorId: MultiEditorStateHolderIdType,
    pos: number,
  ) => void;
  otherEditorView: EditorView;
  otherEditorId: MultiEditorStateHolderIdType;
  updatePairingsCallback: () => void;
}

export const MultiEditorDiffVisuHelperPluginKey =
  new PluginKey<MultiEditorDiffPluginState>("multiEditorDiffVisuHelperPlugin");

export const multiEditorDiffVisuHelperPlugin = (
  props: MultiEditorDiffVisuHelperPluginProps,
  config?: MultiEditorDiffConfig,
) => {
  const diffableNodeTypes =
    config?.diffableNodeTypes ?? DEFAULT_DIFFABLE_NODE_TYPES;
  const textExtractionOptions = config?.textExtractionOptions;
  const nodeTypes = Array.from(diffableNodeTypes);

  return new Plugin<MultiEditorDiffPluginState>({
    key: MultiEditorDiffVisuHelperPluginKey,
    appendTransaction: (transactions, oldState, newState) => {
      const thisEditorId = props.otherEditorId === "left" ? "right" : "left";

      // Handle collapsible headers toggle if configured
      if (config?.collapsibleHeadersPluginKey) {
        const toggleTransaction = transactions.find((transaction) => {
          return transaction.getMeta(config.collapsibleHeadersPluginKey!);
        });

        if (toggleTransaction) {
          const meta = toggleTransaction.getMeta(
            config.collapsibleHeadersPluginKey,
          ) as { enableEscalation: boolean; pos: number };
          if (meta.enableEscalation) {
            props.handleToggleEvent(thisEditorId, meta.pos);
          }
        }
      }

      const docEditTransaction = transactions.find((transaction) => {
        return transaction.docChanged;
      });

      if (!docEditTransaction) {
        return null;
      }

      // find the changed nodes
      const oldUnitRanges = getUnitsInRange(
        oldState.doc,
        0,
        oldState.doc.content.size,
        nodeTypes,
        textExtractionOptions,
      );
      const oldStateNodes: NodeListEntry[] = oldUnitRanges.map((u) => ({
        node: u.node,
        from: u.from + 1,
        text: u.text,
      }));

      const newUnitRanges = getUnitsInRange(
        newState.doc,
        0,
        newState.doc.content.size,
        nodeTypes,
        textExtractionOptions,
      );
      const newStateNodes: NodeListEntry[] = newUnitRanges.map((u) => ({
        node: u.node,
        from: u.from + 1,
        text: u.text,
      }));

      const otherPluginState = multiEditorDiffVisuPluginKey.getState(
        props.otherEditorView.state,
      ) as
        | RunnerState<
            MultiEditorDiffVisuResponse,
            MultiEditorDiffVisuState,
            MultiEditorDiffVisuAdditionalNodeData
          >
        | undefined;

      const updatedNodeList: UpdateContextAction<MultiEditorDiffVisuState> = {
        type: ActionType.UPDATE_CONTEXT,
        contextState: {
          ...(otherPluginState?.contextState ??
            (startingState as MultiEditorDiffVisuState)),
          nodeListFromOtherEditor: newStateNodes,
        },
      };

      props.otherEditorView.dispatch(
        props.otherEditorView.state.tr.setMeta(
          multiEditorDiffVisuPluginKey,
          updatedNodeList,
        ),
      );

      if (oldStateNodes.length !== newStateNodes.length) {
        setTimeout(props.updatePairingsCallback, 0);
        return null;
      }
      const nodePairs = oldStateNodes.map((oldStateNode, index) => {
        return {
          oldNode: oldStateNode,
          oldNodeParents: getParentTypeList(oldState.doc, oldStateNode.from),
          newNode: newStateNodes[index],
          newNodeParents: getParentTypeList(
            newState.doc,
            newStateNodes[index].from,
          ),
          index,
        };
      });
      const changedNodes = nodePairs.filter((nodePair) => {
        if (nodePair.oldNode.text !== nodePair.newNode.text) {
          return true;
        } else if (
          nodePair.oldNode.node.type.name !== nodePair.newNode.node.type.name
        ) {
          return true;
        } else if (
          nodePair.oldNode.node.type.name === "heading" &&
          nodePair.oldNode.node.attrs.level !==
            nodePair.newNode.node.attrs.level
        ) {
          return true;
        } else {
          if (
            nodePair.oldNodeParents.length !== nodePair.newNodeParents.length
          ) {
            return true;
          }
          return nodePair.oldNodeParents.some((parentType, index) => {
            return parentType !== nodePair.newNodeParents[index];
          });
        }
      });

      if (changedNodes.length === 0) {
        return null;
      }

      const metaValue1: MapUnitMetadataAction<MultiEditorDiffVisuAdditionalNodeData> =
        {
          type: ActionType.MAP_UNIT_METADATA,
          mapFunction: (
            metadata: MultiEditorDiffVisuAdditionalNodeData,
          ): MultiEditorDiffVisuAdditionalNodeData | false => {
            if (metadata.pairs === undefined) {
              return false;
            }
            if (metadata.pairs.length === 0) {
              return false;
            }
            let hasChanged = false;
            const newPairs = metadata.pairs
              .map((pair) => {
                const otherNodeIdx = getOtherNode(
                  metadata.editorId,
                  pair,
                )?.index;
                if (otherNodeIdx === undefined) return pair;
                const idx = changedNodes.findIndex((changedNode) => {
                  return otherNodeIdx === changedNode.index;
                });
                if (idx === -1) {
                  return pair;
                }
                hasChanged = true;
                return setOtherNode(metadata.editorId, pair, {
                  body: changedNodes[idx].newNode.text,
                  index: otherNodeIdx,
                  node: changedNodes[idx].newNode.node,
                  similarity: new Map<number, number>(),
                });
              })
              .filter(nonEmpty);
            if (hasChanged) {
              return {
                ...metadata,
                pairs: newPairs,
              };
            } else {
              return false;
            }
          },
        };
      // we drop this to the end of the event loop
      setTimeout(() => {
        props.otherEditorView.dispatch(
          props.otherEditorView.state.tr.setMeta(
            multiEditorDiffVisuPluginKey,
            metaValue1,
          ),
        );
      }, 0);

      const tr = newState.tr;
      const metaValue2: MapUnitMetadataAction<MultiEditorDiffVisuAdditionalNodeData> =
        {
          type: ActionType.MAP_UNIT_METADATA,
          mapFunction: (
            metadata: MultiEditorDiffVisuAdditionalNodeData,
          ): MultiEditorDiffVisuAdditionalNodeData | false => {
            if (metadata.pairs === undefined) {
              return false;
            }
            if (metadata.pairs.length === 0) {
              return false;
            }
            let changedIdx = -1;
            const newPairs = metadata.pairs
              .map((pair) => {
                const thisNodeIdx = getThisNode(metadata.editorId, pair)?.index;
                if (thisNodeIdx === undefined) return pair;
                const idx = changedNodes.findIndex((changedNode) => {
                  return thisNodeIdx === changedNode.index;
                });
                if (idx === -1) {
                  return pair;
                }
                changedIdx = idx;
                return setThisNode(metadata.editorId, pair, {
                  body: changedNodes[idx].newNode.text,
                  index: thisNodeIdx,
                  node: changedNodes[idx].newNode.node,
                  similarity: new Map<number, number>(),
                });
              })
              .filter(nonEmpty);
            if (changedIdx !== -1) {
              return {
                ...metadata,
                pairs: newPairs,
                parentTypeList: changedNodes[changedIdx].newNodeParents,
              };
            } else {
              return false;
            }
          },
        };
      tr.setMeta(multiEditorDiffVisuPluginKey, metaValue2);
      return tr;
    },
  });
};
