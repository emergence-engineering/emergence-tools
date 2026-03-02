import { useEffect, useRef } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { undo, redo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import {
  codeMirrorBlockPlugin,
  defaultSettings,
  languageLoaders,
  legacyLanguageLoaders,
  CodeBlockNodeName,
  codeBlockKeymap,
} from "prosemirror-codemirror-block";

import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/CodeMirrorBlockDemo.tsx";

const codeBlockSpec = schema.spec.nodes.get(CodeBlockNodeName);

const codeBlockSchema = new Schema({
  nodes: schema.spec.nodes.update(CodeBlockNodeName, {
    ...(codeBlockSpec || {}),
    attrs: { ...codeBlockSpec?.attrs, lang: { default: null } },
  }),
  marks: schema.spec.marks,
});

const initialDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This editor uses prosemirror-codemirror-block to render code blocks with full CodeMirror 6 syntax highlighting. Try the language selector dropdown above any code block.",
        },
      ],
    },
    {
      type: CodeBlockNodeName,
      attrs: { lang: "javascript" },
      content: [
        {
          type: "text",
          text: 'function greet(name) {\n  console.log(`Hello, ${name}!`);\n}\n\ngreet("world");',
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "You can also toggle code blocks with Cmd/Ctrl+Alt+C, or use the menu button above.",
        },
      ],
    },
  ],
};

export function CodeMirrorBlockDemo() {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: codeBlockSchema.nodeFromJSON(initialDoc),
      plugins: [
        ...exampleSetup({ schema: codeBlockSchema }),
        codeMirrorBlockPlugin({
          ...defaultSettings,
          languageLoaders: { ...languageLoaders, ...legacyLanguageLoaders },
          undo,
          redo,
        }),
        keymap(codeBlockKeymap),
      ],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction: (tr) => {
        try {
          const newState = view.state.apply(tr);
          view.updateState(newState);
        } catch (e) {
          // ignore
        }
      },
    });

    return () => {
      view.destroy();
    };
  }, []);

  return (
    <div>
      <div className="demo-header">
        <h1 className="demo-title">prosemirror-codemirror-block</h1>
        <p className="demo-description">
          Replaces ProseMirror code blocks with full CodeMirror 6 editors —
          syntax highlighting for 100+ languages, a language selector dropdown,
          theme support, and keyboard shortcuts.
        </p>
        <InstallCommand packageName="prosemirror-codemirror-block" />
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
            Click inside a code block to edit with full CodeMirror features
            (autocomplete, search, etc.)
          </li>
          <li>
            Use the <strong>language selector dropdown</strong> above the code
            block to switch syntax highlighting
          </li>
          <li>
            Press <strong>Cmd/Ctrl + Alt + C</strong> to toggle a code block on
            the current selection
          </li>
          <li>
            Arrow keys escape the code block when the cursor is at the
            top/bottom edge
          </li>
        </ul>
      </div>

      <div className="card editor-card">
        <div className="card-header">
          <span className="card-label">Editor</span>
        </div>
        <div ref={editorRef} />
      </div>
    </div>
  );
}
