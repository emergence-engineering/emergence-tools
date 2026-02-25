import { Plugin, PluginKey } from "prosemirror-state";
import isURL from "is-url";

const key = new PluginKey("paste-link");

const linkinsert = new Plugin({
  key,
  props: {
    handlePaste(view, event, slice) {
      if (
        event.clipboardData &&
        isURL(event.clipboardData.getData("Text")) &&
        view.state.selection.from !== view.state.selection.to
      ) {
        view.dispatch(
          view.state.tr.addMark(
            view.state.selection.from,
            view.state.selection.to,
            view.state.schema.marks.link.create({
              href: event.clipboardData.getData("Text"),
            })
          )
        );

        return true;
      }
      return false;
    },
  },
});

export default linkinsert;
