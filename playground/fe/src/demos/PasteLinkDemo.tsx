import { useEffect, useRef } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, Node, Mark } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import pasteLinkPlugin from "prosemirror-paste-link";
import { DemoLayout } from "../components/DemoLayout";
import { linkTooltipPlugin } from "../components/linkTooltipPlugin";

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
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/PasteLinkDemo.tsx";

function PasteLinkUsage() {
  return (
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
  );
}

function PasteLinkEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: createInitialDoc(),
      plugins: [
        ...exampleSetup({ schema }),
        pasteLinkPlugin,
        linkTooltipPlugin((state, from, to) => {
          const mark = linkMarkAt(state, from);
          if (!mark || (from !== to && !linkMarkAt(state, to))) return undefined;
          return mark.attrs.href as string;
        }),
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
    <div className="card editor-card">
      <div className="card-header">
        <span className="card-label">Editor</span>
        <span className="card-hint">
          Select text, then paste a URL to create a link
        </span>
      </div>
      <div ref={editorRef} style={{ position: "relative" }} />
    </div>
  );
}

export function PasteLinkDemo() {
  return (
    <DemoLayout
      title="prosemirror-paste-link"
      description={
        <>
          When you paste a URL with text selected, the plugin wraps the selection
          in a link instead of replacing it with the URL text. A simple quality-of-life
          improvement for any ProseMirror editor with link support.
        </>
      }
      packageNames={["prosemirror-paste-link"]}
      demoKey="pasteLink"
      sourceUrl={SOURCE_URL}
      usage={<PasteLinkUsage />}
    >
      <PasteLinkEditor />
    </DemoLayout>
  );
}
