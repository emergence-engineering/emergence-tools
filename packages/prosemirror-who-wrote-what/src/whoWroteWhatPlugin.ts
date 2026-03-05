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
  const { userMapKey = "userMap" } = options;

  return new Plugin<WhoWroteWhatState>({
    key: whoWroteWhatPluginKey,
    state: {
      init() {
        return {
          decorations: DecorationSet.empty,
          visible: true,
        };
      },
      apply(tr, prev) {
        const meta = tr.getMeta(whoWroteWhatPluginKey) as
          | WhoWroteWhatMeta
          | undefined;
        if (!meta) return prev;
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

      // Delay initial observation to let ySyncPlugin initialize
      const initTimeout = setTimeout(() => {
        computeDecorations();
        xmlFragment.observeDeep(computeDecorations);
        userMap.observe(computeDecorations);
      }, 100);

      let prevVisible = true;

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
          xmlFragment.unobserveDeep(computeDecorations);
          userMap.unobserve(computeDecorations);
        },
      };
    },
  });
};
