import { EditorState, Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

/**
 * Resolve the href to display in the tooltip.
 * Return `undefined` to hide the tooltip.
 */
export type GetHref = (state: EditorState, from: number, to: number) => string | undefined;

/**
 * A ProseMirror plugin that shows a tooltip below the cursor whenever
 * `getHref` returns a URL for the current selection.
 */
export function linkTooltipPlugin(getHref: GetHref) {
  const key = new PluginKey("link-tooltip");

  let tooltip: HTMLDivElement | null = null;

  function createTooltip(view: EditorView) {
    tooltip = document.createElement("div");
    tooltip.className = "link-tooltip";
    view.dom.parentNode!.appendChild(tooltip);
  }

  function updateTooltip(view: EditorView) {
    if (!tooltip) return;

    const { state } = view;
    const { from, to } = state.selection;

    const href = getHref(state, from, to);
    if (!href) {
      tooltip.style.display = "none";
      return;
    }

    tooltip.innerHTML = "";

    const urlSpan = document.createElement("span");
    urlSpan.className = "link-tooltip-url";
    urlSpan.textContent = href.length > 50 ? href.slice(0, 50) + "\u2026" : href;
    tooltip.appendChild(urlSpan);

    const openLink = document.createElement("a");
    openLink.className = "link-tooltip-open";
    openLink.href = href;
    openLink.target = "_blank";
    openLink.rel = "noopener noreferrer";
    openLink.textContent = "Open \u2197";
    openLink.addEventListener("mousedown", (e) => e.preventDefault());
    tooltip.appendChild(openLink);

    const start = view.coordsAtPos(from);
    const box = (view.dom.parentNode as HTMLElement).getBoundingClientRect();
    tooltip.style.display = "flex";
    tooltip.style.left = `${start.left - box.left}px`;
    tooltip.style.top = `${start.bottom - box.top + 4}px`;
  }

  return new Plugin({
    key,
    view(editorView) {
      createTooltip(editorView);
      updateTooltip(editorView);
      return {
        update(view) {
          updateTooltip(view);
        },
        destroy() {
          tooltip?.remove();
          tooltip = null;
        },
      };
    },
  });
}
