import { useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { SlashMenuPlugin } from "prosemirror-slash-menu";
import { completePluginV2 } from "prosemirror-suggestcat-plugin";
import {
  ProsemirrorSuggestcatPluginReact,
  promptCommands,
  slashOpeningCondition,
} from "prosemirror-suggestcat-plugin-react";
import { InstallCommand } from "../components/InstallCommand";

const SOURCE_URL =
  "https://github.com/emergence-engineering/ee-prosemirror-tools/blob/main/playground/fe/src/demos/SuggestcatFixDemo.tsx";

const apiKey = "-qKivjCv6MfQSmgF438PjEY7RnLfqoVe";
const mainModel = "cerebras:gpt-oss-120b";

const initialDoc = schema.nodes.doc.create(null, [
  schema.nodes.heading.create(
    { level: 2 },
    schema.text("AI Actions Demo"),
  ),
  schema.nodes.paragraph.create(
    null,
    schema.text(
      "Select some text in this editor and press / to open the AI command menu. You can Complete, Simplify, Translate, Change Tone, Make Longer or Shorter, and more.",
    ),
  ),
  schema.nodes.paragraph.create(
    null,
    schema.text(
      "The results stream in as a suggestion overlay that you can accept or reject. Try selecting the next sentence and simplifying it: Notwithstanding the aforementioned considerations, the implementation of the proposed solution necessitates a comprehensive evaluation of the multifaceted implications.",
    ),
  ),
]);

export function SuggestcatFixDemo() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const completePlugin = completePluginV2(apiKey, { model: mainModel });

    const slashPlugin = SlashMenuPlugin(
      promptCommands,
      undefined,
      slashOpeningCondition,
    );

    const state = EditorState.create({
      doc: initialDoc,
      plugins: [
        completePlugin,
        slashPlugin,
        ...exampleSetup({ schema }),
      ],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(tr) {
        const newState = view.state.apply(tr);
        view.updateState(newState);
        setEditorState(newState);
      },
    });

    viewRef.current = view;
    setEditorState(state);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  return (
    <div>
      <div className="demo-header">
        <h1 className="demo-title">Suggestcat: AI Actions</h1>
        <p className="demo-description">
          Prompt-based AI editing via a slash menu. Select text and press{" "}
          <strong>/</strong> to open the command menu with actions like Complete,
          Simplify, Translate, Change Tone, Make Longer/Shorter, Explain, and
          Action Items. Results stream in as a suggestion overlay.
        </p>
        <InstallCommand packageName="prosemirror-suggestcat-plugin" />
        <InstallCommand packageName="prosemirror-suggestcat-plugin-react" />
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
            <strong>Select text</strong> in the editor, then press{" "}
            <code>/</code> to open the AI command menu.
          </li>
          <li>
            Choose an action: <strong>Complete</strong>, <strong>Simplify</strong>,{" "}
            <strong>Make Shorter</strong>, <strong>Translate</strong>, etc.
          </li>
          <li>
            The result streams in as a <strong>suggestion overlay</strong> —
            accept or reject it.
          </li>
          <li>
            <strong>Change Tone</strong> and <strong>Translate</strong> open
            sub-menus with additional options.
          </li>
        </ul>
      </div>

      <div className="card editor-card">
        <div ref={editorRef} />
        {editorState && viewRef.current && (
          <ProsemirrorSuggestcatPluginReact
            editorView={viewRef.current}
            editorState={editorState}
          />
        )}
      </div>
    </div>
  );
}
