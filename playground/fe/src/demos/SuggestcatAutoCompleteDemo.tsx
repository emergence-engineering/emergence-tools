import { useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  autoCompletePlugin,
  setAutoCompleteEnabled,
  setAutoCompleteSystemPrompt,
  isAutoCompleteEnabled,
} from "prosemirror-suggestcat-plugin";
import { DemoLayout } from "../components/DemoLayout";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/SuggestcatAutoCompleteDemo.tsx";

const apiKey = "-qKivjCv6MfQSmgF438PjEY7RnLfqoVe";
const mainModel = "cerebras:gpt-oss-120b";

const SAMPLE_AUTOCOMPLETE_PROMPT =
  "You are a creative fiction writer. Complete sentences in a whimsical, storytelling tone with vivid imagery. If the text does not appear to be mid-sentence, do not generate anything.";

const initialDoc = schema.nodes.doc.create(null, [
  schema.nodes.heading.create(
    { level: 2 },
    schema.text("Autocomplete Demo"),
  ),
  schema.nodes.paragraph.create(
    null,
    schema.text(
      "Start typing and wait a moment — ghost text will appear suggesting how to continue your sentence. Press Tab to accept the suggestion or keep typing to dismiss it.",
    ),
  ),
  schema.nodes.paragraph.create(
    null,
    schema.text("The quick brown fox"),
  ),
]);

function SuggestcatAutoCompleteUsage() {
  return (
    <ul className="demo-usage-list">
      <li>
        Type some text and pause — a ghost-text suggestion will appear after
        a 2-second debounce.
      </li>
      <li>
        Press <code>Tab</code> to accept the suggestion, or keep typing to
        dismiss it.
      </li>
      <li>
        Use the toggle button below to enable/disable autocomplete.
      </li>
    </ul>
  );
}

function SuggestcatAutoCompleteEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const autoComplete = autoCompletePlugin(apiKey, {
      model: mainModel,
      debounceMs: 2000,
    });

    const state = EditorState.create({
      doc: initialDoc,
      plugins: [autoComplete, ...exampleSetup({ schema })],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(tr) {
        const newState = view.state.apply(tr);
        view.updateState(newState);
      },
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  const handleToggle = () => {
    const view = viewRef.current;
    if (!view) return;
    const current = isAutoCompleteEnabled(view);
    setAutoCompleteEnabled(view, !current);
    setEnabled(!current);
  };

  const handleCustomPromptToggle = () => {
    const view = viewRef.current;
    if (!view) return;
    const next = !useCustomPrompt;
    setUseCustomPrompt(next);
    setAutoCompleteSystemPrompt(
      view,
      next ? SAMPLE_AUTOCOMPLETE_PROMPT : undefined,
    );
  };

  return (
    <>
      <div className="suggestcat-controls">
        <button
          className={`suggestcat-toggle-btn ${enabled ? "suggestcat-toggle-on" : "suggestcat-toggle-off"}`}
          onClick={handleToggle}
        >
          Autocomplete: {enabled ? "ON" : "OFF"}
        </button>
      </div>

      <div className="suggestcat-custom-prompt-section">
        <div className="suggestcat-custom-prompt-row">
          <button
            className={`suggestcat-toggle-btn ${useCustomPrompt ? "suggestcat-toggle-on" : "suggestcat-toggle-off"}`}
            onClick={handleCustomPromptToggle}
          >
            Custom Prompt: {useCustomPrompt ? "ON" : "OFF"}
          </button>
          <textarea
            className="suggestcat-prompt-preview"
            readOnly
            value={SAMPLE_AUTOCOMPLETE_PROMPT}
            rows={2}
          />
        </div>
      </div>

      <div className="card editor-card">
        <div ref={editorRef} />
      </div>
    </>
  );
}

export function SuggestcatAutoCompleteDemo() {
  return (
    <DemoLayout
      title="Suggestcat: Autocomplete"
      description={
        <>
          Inline ghost-text autocomplete powered by AI. As you type, the plugin
          debounces and requests a completion — the suggestion appears as faded
          text after the cursor. Press <strong>Tab</strong> to accept.
        </>
      }
      packageNames={["prosemirror-suggestcat-plugin"]}
      sourceUrl={SOURCE_URL}
      usage={<SuggestcatAutoCompleteUsage />}
      demoKey="suggestcatAutoComplete"
    >
      <SuggestcatAutoCompleteEditor />
    </DemoLayout>
  );
}
