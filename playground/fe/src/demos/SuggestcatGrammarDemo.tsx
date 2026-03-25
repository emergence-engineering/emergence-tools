import { useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  grammarSuggestPluginV2,
  grammarSuggestV2Key,
  grammarSuggestInit,
} from "prosemirror-suggestcat-plugin";
import {
  ActionType,
  pauseRunner,
  resumeRunner,
} from "@emergence-engineering/prosemirror-block-runner";
import {
  ProsemirrorSuggestcatPluginReact,
  GrammarPopup,
} from "prosemirror-suggestcat-plugin-react";
import { DemoLayout } from "../components/DemoLayout";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/SuggestcatGrammarDemo.tsx";

const apiKey = "-qKivjCv6MfQSmgF438PjEY7RnLfqoVe";
const mainModel = "cerebras:gpt-oss-120b";

const SAMPLE_GRAMMAR_PROMPT =
  "You are a strict academic writing reviewer. Flag informal language, passive voice, and suggest formal alternatives. Return only the fixed text, keeping all separators intact.";

const SAMPLE_HINT_PROMPT =
  "You are a writing tutor. Explain the grammar correction in simple terms, including the rule that applies and a short example of correct usage.";

const initialDoc = schema.nodes.doc.create(null, [
  schema.nodes.heading.create(
    { level: 2 },
    schema.text("Grammar Checking Demo"),
  ),
  schema.nodes.paragraph.create(
    null,
    schema.text(
      "This sentnce has a intentional mistake. The grammar checker will detect it and show a underlined decoration.",
    ),
  ),
  schema.nodes.paragraph.create(
    null,
    schema.text(
      "Try typing more text with grammer errors to see them highlighted automaticaly.",
    ),
  ),
]);

function SuggestcatGrammarUsage() {
  return (
    <ul className="demo-usage-list">
      <li>
        Grammar errors are detected automatically and shown as{" "}
        <strong>underlined text</strong>.
      </li>
      <li>
        Click a highlighted word to open the <strong>grammar popup</strong>{" "}
        showing the original and suggested replacement.
      </li>
      <li>
        Use the <strong>?</strong> button in the popup to get an AI
        explanation of the correction.
      </li>
      <li>
        Use the controls below to <strong>pause/resume</strong> or{" "}
        <strong>reset</strong> the grammar checker.
      </li>
    </ul>
  );
}

function SuggestcatGrammarEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [running, setRunning] = useState(true);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [useCustomHintPrompt, setUseCustomHintPrompt] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const grammarPlugin = grammarSuggestPluginV2(apiKey, {
      batchSize: 2,
      model: mainModel,
      createPopup: "react",
      fallback: {
        fallbackModel: "openai:gpt-4o-mini",
        failureThreshold: 3,
      },
    });

    const state = EditorState.create({
      doc: initialDoc,
      plugins: [grammarPlugin, ...exampleSetup({ schema })],
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

    // Auto-start grammar checking
    grammarSuggestInit(view, grammarSuggestV2Key);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  const handlePauseResume = () => {
    const view = viewRef.current;
    if (!view) return;
    if (running) {
      pauseRunner(view, grammarSuggestV2Key);
    } else {
      resumeRunner(view, grammarSuggestV2Key);
    }
    setRunning(!running);
  };

  const handleReset = () => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch(
      view.state.tr.setMeta(grammarSuggestV2Key, {
        type: ActionType.CLEAR,
      }),
    );
    setTimeout(() => {
      grammarSuggestInit(view, grammarSuggestV2Key);
      setRunning(true);
    }, 10);
  };

  const handleCustomPromptToggle = () => {
    const view = viewRef.current;
    if (!view) return;
    const next = !useCustomPrompt;
    setUseCustomPrompt(next);
    // Clear and re-init with new prompt
    view.dispatch(
      view.state.tr.setMeta(grammarSuggestV2Key, {
        type: ActionType.CLEAR,
      }),
    );
    setTimeout(() => {
      grammarSuggestInit(
        view,
        grammarSuggestV2Key,
        next ? SAMPLE_GRAMMAR_PROMPT : undefined,
      );
    }, 10);
  };

  const handleCustomHintToggle = () => {
    setUseCustomHintPrompt(!useCustomHintPrompt);
  };

  return (
    <>
      <div className="suggestcat-controls">
        <button
          className={`suggestcat-toggle-btn ${running ? "suggestcat-toggle-on" : "suggestcat-toggle-off"}`}
          onClick={handlePauseResume}
        >
          Grammar: {running ? "Running" : "Paused"}
        </button>
        <button className="suggestcat-action-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className="suggestcat-custom-prompt-section">
        <div className="suggestcat-custom-prompt-row">
          <button
            className={`suggestcat-toggle-btn ${useCustomPrompt ? "suggestcat-toggle-on" : "suggestcat-toggle-off"}`}
            onClick={handleCustomPromptToggle}
          >
            Custom Grammar Prompt: {useCustomPrompt ? "ON" : "OFF"}
          </button>
          <textarea
            className="suggestcat-prompt-preview"
            readOnly
            value={SAMPLE_GRAMMAR_PROMPT}
            rows={2}
          />
        </div>
        <div className="suggestcat-custom-prompt-row">
          <button
            className={`suggestcat-toggle-btn ${useCustomHintPrompt ? "suggestcat-toggle-on" : "suggestcat-toggle-off"}`}
            onClick={handleCustomHintToggle}
          >
            Custom Hint Prompt: {useCustomHintPrompt ? "ON" : "OFF"}
          </button>
          <textarea
            className="suggestcat-prompt-preview"
            readOnly
            value={SAMPLE_HINT_PROMPT}
            rows={2}
          />
        </div>
      </div>

      <div className="card editor-card">
        <div ref={editorRef} />
        {editorState && viewRef.current && (
          <>
            <ProsemirrorSuggestcatPluginReact
              editorView={viewRef.current}
              editorState={editorState}
            />
            <GrammarPopup
              editorView={viewRef.current}
              editorState={editorState}
              apiKey={apiKey}
              model={mainModel}
              hintSystemPrompt={
                useCustomHintPrompt ? SAMPLE_HINT_PROMPT : undefined
              }
            />
          </>
        )}
      </div>
    </>
  );
}

export function SuggestcatGrammarDemo() {
  return (
    <DemoLayout
      title="Suggestcat: Grammar"
      description={
        <>
          AI-powered grammar checking that runs automatically in the background.
          Mistakes are highlighted with underline decorations. Click a
          highlighted word to see the suggestion popup with accept/discard
          actions and an optional hint explanation.
        </>
      }
      packageNames={["prosemirror-suggestcat-plugin", "prosemirror-suggestcat-plugin-react"]}
      sourceUrl={SOURCE_URL}
      usage={<SuggestcatGrammarUsage />}
      demoKey="suggestcatGrammar"
    >
      <SuggestcatGrammarEditor />
    </DemoLayout>
  );
}
