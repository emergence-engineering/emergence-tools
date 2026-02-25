import React, { FC, useCallback, useMemo, useState } from "react";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { usePopper } from "react-popper";
import {
  grammarSuggestV2Key,
  getSelectedDecoration,
  acceptSuggestion,
  discardSuggestion,
  requestHint,
  GrammarDecorationSpec,
} from "prosemirror-suggestcat-plugin";

export const GrammarPopup: FC<{
  editorView: EditorView;
  editorState: EditorState;
  apiKey: string;
  apiEndpoint?: string;
  model?: string;
}> = ({ editorView, editorState, apiKey, apiEndpoint, model }) => {
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  );
  const [hintState, setHintState] = useState<{
    visible: boolean;
    loading: boolean;
    text?: string;
    error?: boolean;
  }>({ visible: false, loading: false });

  const selectedDecoration = useMemo(() => {
    if (!editorView?.state) return undefined;
    return getSelectedDecoration(editorView, grammarSuggestV2Key);
  }, [editorView, editorState]);

  const spec = selectedDecoration?.spec as
    | GrammarDecorationSpec
    | undefined;

  const virtualRef = useMemo(() => {
    if (!editorView || !selectedDecoration) return undefined;

    const coords = editorView.coordsAtPos(selectedDecoration.from);
    return {
      getBoundingClientRect() {
        return {
          top: coords.top,
          right: coords.right,
          bottom: coords.bottom,
          left: coords.left,
          width: coords.right - coords.left,
          height: coords.bottom - coords.top,
          x: coords.left,
          y: coords.top,
          toJSON() {
            return JSON.stringify(this);
          },
        };
      },
    };
  }, [editorView, selectedDecoration]);

  const { styles, attributes } = usePopper(virtualRef, popperElement, {
    placement: "bottom-start",
    modifiers: [
      { name: "flip", enabled: true },
      {
        name: "preventOverflow",
        options: { mainAxis: true },
      },
      {
        name: "offset",
        options: { offset: [0, 4] },
      },
    ],
  });

  const handleAccept = useCallback(() => {
    if (!editorView || !spec) return;
    setHintState({ visible: false, loading: false });
    acceptSuggestion(editorView, grammarSuggestV2Key, spec.id);
  }, [editorView, spec]);

  const handleDiscard = useCallback(() => {
    if (!editorView || !spec) return;
    setHintState({ visible: false, loading: false });
    discardSuggestion(editorView, grammarSuggestV2Key, spec.id);
  }, [editorView, spec]);

  const handleHint = useCallback(() => {
    if (!spec) return;

    if (hintState.visible && hintState.text) {
      setHintState((prev) => ({ ...prev, visible: !prev.visible }));
      return;
    }

    setHintState({ visible: true, loading: true });

    requestHint(apiKey, spec.originalText, spec.replacement, {
      endpoint: apiEndpoint,
      model,
    }).then(
      (hint) => {
        setHintState({ visible: true, loading: false, text: hint });
      },
      () => {
        setHintState({ visible: true, loading: false, error: true });
      },
    );
  }, [spec, apiKey, apiEndpoint, model, hintState.visible, hintState.text]);

  // Reset hint state when selection changes
  const prevSpecId = React.useRef<object | undefined>();
  if (spec?.id !== prevSpecId.current) {
    prevSpecId.current = spec?.id;
    if (hintState.visible || hintState.text || hintState.error) {
      setHintState({ visible: false, loading: false });
    }
  }

  if (!selectedDecoration || !spec) {
    return null;
  }

  return (
    <div
      ref={setPopperElement}
      className="grammarPopupV2"
      style={styles.popper}
      {...attributes.popper}
    >
      <div className="grammarPopupV2-mainRow">
        <span className="grammarPopupV2-original">
          &ldquo;{spec.originalText}&rdquo;
        </span>
        <span className="grammarPopupV2-arrow"> → </span>
        <span className="grammarPopupV2-replacement">
          {spec.replacement === "" ? "(remove)" : `\u201C${spec.replacement}\u201D`}
        </span>
        <button
          className="grammarPopupV2-hint"
          title="Why this suggestion?"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleHint();
          }}
        >
          ?
        </button>
        <button
          className="grammarPopupV2-accept"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAccept();
          }}
        >
          ✓
        </button>
        <button
          className="grammarPopupV2-discard"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDiscard();
          }}
        >
          ✕
        </button>
      </div>
      {hintState.visible && (
        <div className="grammarPopupV2-hintArea">
          {hintState.loading && (
            <span className="grammarPopupV2-loading">Loading...</span>
          )}
          {hintState.text && (
            <span className="grammarPopupV2-hintText">{hintState.text}</span>
          )}
          {hintState.error && (
            <span className="grammarPopupV2-hintError">
              Could not load hint
            </span>
          )}
        </div>
      )}
    </div>
  );
};
