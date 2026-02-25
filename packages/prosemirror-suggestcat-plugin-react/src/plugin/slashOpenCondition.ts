import { OpeningConditions } from "prosemirror-slash-menu/dist/types";
import { SlashMenuState } from "prosemirror-slash-menu";
import { EditorView } from "prosemirror-view";

export const slashOpeningCondition: OpeningConditions = {
  shouldOpen: (
    state: SlashMenuState,
    event: KeyboardEvent,
    view: EditorView,
  ) => {
    const editorState = view.state;
    const resolvedPos =
      editorState.selection.from < 0 ||
      editorState.selection.from > editorState.doc.content.size
        ? null
        : editorState.doc.resolve(editorState.selection.from);

    const parentNode = resolvedPos?.parent;
    const inParagraph = parentNode?.type.name === "paragraph";
    return (
      !state.open &&
      event.key === "/" &&
      inParagraph &&
      editorState.selection.from !== editorState.selection.to
    );
  },
  shouldClose: (state: SlashMenuState, event: KeyboardEvent) =>
    state.open &&
    (event.key === "/" ||
      event.key === "Escape" ||
      event.key === "Backspace") &&
    state.filter.length === 0,
};
