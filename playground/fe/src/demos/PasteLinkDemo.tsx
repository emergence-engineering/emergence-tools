import { useEffect, useRef } from "react";
import { EditorState, Plugin, PluginKey, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, Node, Mark } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import pasteLinkPlugin from "prosemirror-paste-link";
import { InstallCommand } from "../components/InstallCommand";

// Extend basic schema with a link mark
const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks.update("link", {
    attrs: {
      href: {},
      title: { default: null },
    },
    inclusive: false,
    parseDOM: [
      {
        tag: "a[href]",
        getAttrs(dom: HTMLElement) {
          return {
            href: dom.getAttribute("href"),
            title: dom.getAttribute("title"),
          };
        },
      },
    ],
    toDOM(node) {
      const { href, title } = node.attrs;
      return ["a", { href, title }, 0];
    },
  }),
});

/** Find the link mark at the given position, if any. */
function linkMarkAt(state: EditorState, pos: number): Mark | undefined {
  const $pos = state.doc.resolve(pos);
  const { link } = state.schema.marks;
  const storedMarks = state.storedMarks || $pos.marks();
  return link ? storedMarks.find((m) => m.type === link) : undefined;
}

/**
 * A simple ProseMirror plugin that shows a tooltip below the cursor
 * whenever it sits inside a link mark.
 */
function linkTooltipPlugin() {
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

    // Only show for cursor (collapsed selection) or small selection within one link
    const mark = linkMarkAt(state, from);
    if (!mark || (from !== to && !linkMarkAt(state, to))) {
      tooltip.style.display = "none";
      return;
    }

    const href = mark.attrs.href as string;
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

    // Position the tooltip below the link text
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

function createInitialDoc(): Node {
  const { nodes, marks } = schema;
  const strong = marks.strong.create();
  const link = marks.link.create({ href: "https://emergence-engineering.com" });

  return nodes.doc.create(null, [
    nodes.heading.create({ level: 2 }, [schema.text("Paste Link Demo")]),
    nodes.paragraph.create(null, [
      schema.text("This plugin turns a paste action into a link. "),
      schema.text("Select some text", [strong]),
      schema.text(
        " in the editor below, then paste a URL from your clipboard. Instead of replacing the selection, the text will become a clickable link.",
      ),
    ]),
    nodes.heading.create({ level: 3 }, [schema.text("Try it out")]),
    nodes.paragraph.create(null, [
      schema.text(
        "Copy a URL (like https://github.com) to your clipboard, then select the following text and paste: ",
      ),
      schema.text("click here to visit our website", [strong]),
      schema.text("."),
    ]),
    nodes.paragraph.create(null, [
      schema.text("Here is an existing link for reference: "),
      schema.text("Emergence Engineering", [link]),
      schema.text(". You can create links just like this one by selecting text and pasting a URL."),
    ]),
  ]);
}

const SOURCE_URL =
  "https://github.com/emergence-engineering/ee-prosemirror-tools/blob/main/playground/fe/src/demos/PasteLinkDemo.tsx";

export function PasteLinkDemo() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: createInitialDoc(),
      plugins: [
        ...exampleSetup({ schema }),
        pasteLinkPlugin,
        linkTooltipPlugin(),
      ],
    });

    viewRef.current = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(tr: Transaction) {
        const newState = viewRef.current!.state.apply(tr);
        viewRef.current!.updateState(newState);
      },
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  return (
    <div>
      <div className="demo-header">
        <h1 className="demo-title">prosemirror-paste-link</h1>
        <p className="demo-description">
          When you paste a URL with text selected, the plugin wraps the selection
          in a link instead of replacing it with the URL text. A simple quality-of-life
          improvement for any ProseMirror editor with link support.
        </p>
        <InstallCommand packageName="prosemirror-paste-link" />
        <a
          className="source-link"
          href={SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          View source on GitHub
        </a>
      </div>

      <div className="demo-usage">
        <h3 className="demo-usage-title">How to use this demo</h3>
        <ul className="demo-usage-list">
          <li>
            <strong>Copy a URL</strong> to your clipboard (e.g.{" "}
            <code>https://github.com</code>).
          </li>
          <li>
            <strong>Select some text</strong> in the editor below.
          </li>
          <li>
            <strong>Paste</strong> (<code>Ctrl+V</code> / <code>Cmd+V</code>) —
            the selected text becomes a link pointing to the pasted URL.
          </li>
          <li>
            <strong>Click on a link</strong> to see a tooltip with the URL and
            an option to open it.
          </li>
        </ul>
      </div>

      <div className="card editor-card">
        <div className="card-header">
          <span className="card-label">Editor</span>
          <span className="card-hint">
            Select text, then paste a URL to create a link
          </span>
        </div>
        <div ref={editorRef} style={{ position: "relative" }} />
      </div>
    </div>
  );
}
