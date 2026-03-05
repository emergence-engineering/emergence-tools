import { Plugin, PluginKey } from "prosemirror-state";
import { DecorationSet, EditorView } from "prosemirror-view";
import { ySyncPluginKey } from "y-prosemirror";
import { Doc, XmlFragment } from "yjs";

import { getDecorationSet, writeClientIdsToYDoc } from "./core";
import { UserMapEntry, WhoWroteWhatOptions } from "./types";

export const whoWroteWhatPluginKey = new PluginKey<WhoWroteWhatState>(
  "WhoWroteWhat",
);

export enum WhoWroteWhatMetaType {
  UpdateDecorations = "UpdateDecorations",
  SetVisibility = "SetVisibility",
}

export type UpdateWhoWroteWhatDecorationsMeta = {
  set: DecorationSet;
  type: WhoWroteWhatMetaType.UpdateDecorations;
};

type SetWhoWroteWhatVisibilityMeta = {
  type: WhoWroteWhatMetaType.SetVisibility;
  visible: boolean;
};

type WhoWroteWhatMeta =
  | UpdateWhoWroteWhatDecorationsMeta
  | SetWhoWroteWhatVisibilityMeta;

type WhoWroteWhatState = {
  decorations: DecorationSet;
  visible: boolean;
};

export const setWhoWroteWhatVisibility = (
  view: EditorView,
  visible: boolean,
) => {
  const meta: SetWhoWroteWhatVisibilityMeta = {
    type: WhoWroteWhatMetaType.SetVisibility,
    visible,
  };
  view.dispatch(view.state.tr.setMeta(whoWroteWhatPluginKey, meta));
};

export interface WhoWroteWhatPluginConfig {
  userId: string | number;
  options?: WhoWroteWhatOptions;
}

export const createWhoWroteWhatPlugin = ({
  userId,
  options = {},
}: WhoWroteWhatPluginConfig) => {
  const { userMapKey = "userMap", startVisible = true, debounceFactor = 1.5 } = options;

  return new Plugin<WhoWroteWhatState>({
    key: whoWroteWhatPluginKey,
    state: {
      init() {
        return {
          decorations: DecorationSet.empty,
          visible: startVisible,
        };
      },
      apply(tr, prev) {
        const meta = tr.getMeta(whoWroteWhatPluginKey) as
          | WhoWroteWhatMeta
          | undefined;
        if (!meta) {
          // No plugin meta — remap existing decorations through the
          // transaction mapping so they stay aligned while the debounced
          // full recompute is pending.
          if (tr.docChanged) {
            return {
              decorations: prev.decorations.map(tr.mapping, tr.doc),
              visible: prev.visible,
            };
          }
          return prev;
        }
        if (meta.type === WhoWroteWhatMetaType.SetVisibility)
          return {
            decorations: meta.visible ? prev.decorations : DecorationSet.empty,
            visible: meta.visible,
          };
        return { decorations: meta.set, visible: prev.visible };
      },
    },
    props: {
      decorations(state) {
        return whoWroteWhatPluginKey.getState(state)?.decorations;
      },
    },
    view(editorView) {
      const ySyncState = ySyncPluginKey.getState(editorView.state);
      if (!ySyncState) {
        throw new Error(
          "prosemirror-who-wrote-what requires ySyncPlugin — add ySyncPlugin to your plugins before createWhoWroteWhatPlugin",
        );
      }
      const ydoc = ySyncState.doc as Doc;
      const xmlFragment = ySyncState.type as XmlFragment;
      const userMap = ydoc.getMap<UserMapEntry>(userMapKey);

      const computeDecorations = () => {
        writeClientIdsToYDoc(ydoc, userId, userMapKey);
        const { state } = editorView;
        const ySyncPluginState = ySyncPluginKey.getState(state);
        if (!ySyncPluginState?.binding) return;

        const pluginState = whoWroteWhatPluginKey.getState(state);
        if (!pluginState || !pluginState.visible) return;

        const set = getDecorationSet(
          ySyncPluginState.binding,
          state,
          userMap,
          options,
        );

        const meta: UpdateWhoWroteWhatDecorationsMeta = {
          set,
          type: WhoWroteWhatMetaType.UpdateDecorations,
        };
        editorView.dispatch(
          editorView.state.tr.setMeta(whoWroteWhatPluginKey, meta),
        );
      };

      // Adaptive debounce: delay scales with computation time
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let lastComputeMs = 0;

      const scheduleCompute = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        const delay = Math.round(lastComputeMs * debounceFactor);
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          const start = performance.now();
          computeDecorations();
          lastComputeMs = performance.now() - start;
        }, delay);
      };

      // Delay initial observation to let ySyncPlugin initialize
      const initTimeout = setTimeout(() => {
        computeDecorations();
        xmlFragment.observeDeep(scheduleCompute);
        userMap.observe(scheduleCompute);
      }, 100);

      let prevVisible = startVisible;

      return {
        update(view) {
          const pluginState = whoWroteWhatPluginKey.getState(view.state);
          if (!pluginState) return;
          const nowVisible = pluginState.visible;
          // Recompute decorations when re-enabled
          if (nowVisible && !prevVisible) {
            // Use setTimeout to avoid dispatching during an update cycle
            setTimeout(computeDecorations, 0);
          }
          prevVisible = nowVisible;
        },
        destroy() {
          clearTimeout(initTimeout);
          if (debounceTimer) clearTimeout(debounceTimer);
          xmlFragment.unobserveDeep(scheduleCompute);
          userMap.unobserve(scheduleCompute);
        },
      };
    },
  });
};
