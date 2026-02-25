import React, { FC, useCallback, useMemo, useState } from "react";
import { SlashMenuReact } from "prosemirror-slash-menu-react";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { promptIcons, PromptIcons } from "./promptIcons";
import { SuggestionOverlay } from "./SuggestionOverlay";
import { completeV2Key, CompleteStatus } from "prosemirror-suggestcat-plugin";
import {
  dispatchWithMeta,
  SlashMenuKey,
  SlashMetaTypes,
} from "prosemirror-slash-menu";
import { usePopper } from "react-popper";

export const ProsemirrorSuggestcatPluginReact: FC<{
  editorView: EditorView;
  editorState: EditorState;
  domReference?: HTMLElement;
}> = ({ editorView, editorState, domReference }) => {
  const slashMenuPopperRef = useMemo(() => {
    if (!editorView || !editorView?.state) {
      return;
    }

    const currentNode = editorView.domAtPos(editorView.state.selection.to)
      ?.node;

    if (!currentNode) {
      return;
    }

    if (currentNode instanceof Text) {
      return currentNode.parentElement;
    }

    return currentNode instanceof HTMLElement ? currentNode : undefined;
  }, [editorView?.state?.selection, window.scrollY]);

  const [toolTipPopperElement, setToolTipPopperElement] =
    useState<HTMLDivElement | null>(null);
  const suggestionState = useMemo(() => {
    if (!editorView?.state) return;
    return completeV2Key.getState(editorView?.state);
  }, [editorView?.state]);

  const overlayElement = useMemo(() => {
    return document.getElementById("suggestion-overlay");
  }, [editorState]);
  const tooltipVirtualRef = useMemo(() => {
    if (!editorView || !editorView?.state) {
      return;
    }

    const selection = editorView.state.selection;
    // Use selection.from for vertical positioning (start of selection)
    const coords = editorView.coordsAtPos(selection.from);
    // Use editor's left edge for horizontal positioning
    const editorRect = editorView.dom.getBoundingClientRect();

    return {
      getBoundingClientRect() {
        return {
          top: coords.top,
          right: editorRect.left,
          bottom: coords.bottom,
          left: editorRect.left,
          width: 0,
          height: coords.bottom - coords.top,
          x: editorRect.left,
          y: coords.top,
          toJSON() {
            return JSON.stringify(this);
          },
        };
      },
    };
  }, [editorView?.state?.selection, window.scrollY]);

  const slashMenuDomReference = useMemo(() => {
    return overlayElement || domReference || slashMenuPopperRef || undefined;
  }, [domReference, overlayElement, suggestionState, slashMenuPopperRef]);
  const shouldDisplay = useMemo(() => {
    if (!editorView?.state) return false;
    const slashMenuOpen = SlashMenuKey.getState(editorView?.state)?.open;

    return (
      editorView?.state?.selection.from !== editorView?.state?.selection.to &&
      !slashMenuOpen &&
      suggestionState?.status === CompleteStatus.IDLE
    );
  }, [editorView?.state, suggestionState]);
  const handleTooltipClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!editorView) return;
      dispatchWithMeta(editorView, SlashMenuKey, {
        type: SlashMetaTypes.open,
      });
      return true;
    },
    [editorView],
  );
  const { styles: tooltipStyles, attributes: tooltipAttrs } = usePopper(
    tooltipVirtualRef,
    toolTipPopperElement,
    {
      placement: "left",
      modifiers: [
        { name: "flip", enabled: true },
        {
          name: "preventOverflow",
          options: {
            mainAxis: false,
          },
        },
        {
          name: "offset",
          options: {
            offset: [0, 36],
          },
        },
      ],
    },
  );
  return (
    <>
      <div>
        {shouldDisplay && (
          <div
            id={"popper"}
            ref={setToolTipPopperElement}
            className={"ai-tooltip"}
            style={{
              ...tooltipStyles.popper,
            }}
            {...tooltipAttrs.popper}
            onClick={handleTooltipClick}
          >
            {promptIcons.StarIcon()}
            <div className={"ai-tooltip-label"}>Ask AI</div>
          </div>
        )}

        {suggestionState?.status !== CompleteStatus.IDLE && (
          <SuggestionOverlay
            editorView={editorView}
            status={suggestionState?.status}
            domReference={domReference || slashMenuPopperRef}
            content={suggestionState?.streamedResult}
          />
        )}
        <SlashMenuReact
          editorState={editorState}
          editorView={editorView}
          filterPlaceHolder="Start writing a prompt or choose from below..."
          disableInput
          mainMenuLabel="Actions"
          popperReference={slashMenuDomReference}
          icons={{
            [PromptIcons.FixGrammar]: promptIcons.FixGrammarIcon,
            [PromptIcons.MakeItShorter]: promptIcons.MakeItShorterIcon,
            [PromptIcons.MakeItLonger]: promptIcons.MakeItLongerIcon,
            [PromptIcons.Complete]: promptIcons.CompleteIcon,
            [PromptIcons.Explain]: promptIcons.ExplainIcon,
            [PromptIcons.Simplify]: promptIcons.SimplifyIcon,
            [PromptIcons.ChangeTone]: promptIcons.ChangeToneIcon,
            [PromptIcons.Translate]: promptIcons.TranslateIcon,
            [PromptIcons.ActionItems]: promptIcons.ActionItemsIcon,
          }}
          rightIcons={{
            [PromptIcons.ChangeTone]: promptIcons.SubMenuArrowIcon,
            [PromptIcons.Translate]: promptIcons.SubMenuArrowIcon,
          }}
          clickable={true}
        />
      </div>
    </>
  );
};
