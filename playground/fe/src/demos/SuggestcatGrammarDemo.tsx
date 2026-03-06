import { useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  grammarSuggestPluginV2,
  grammarSuggestV2Key,
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
    view.dispatch(
      view.state.tr.setMeta(grammarSuggestV2Key, {
        type: ActionType.INIT,
        metadata: {},
      }),
    );

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
      view.dispatch(
        view.state.tr.setMeta(grammarSuggestV2Key, {
          type: ActionType.INIT,
          metadata: {},
        }),
      );
      setRunning(true);
    }, 10);
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
