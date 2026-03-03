import { useEffect, useRef, useState } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { SlashMenuPlugin } from "prosemirror-slash-menu";
import {
  grammarSuggestPluginV2,
  grammarSuggestV2Key,
  ActionType,
  completePluginV2,
  autoCompletePlugin,
  pauseRunner,
  resumeRunner,
  setAutoCompleteEnabled,
  isAutoCompleteEnabled,
} from "prosemirror-suggestcat-plugin";
import {
  ProsemirrorSuggestcatPluginReact,
  GrammarPopup,
  promptCommands,
  slashOpeningCondition,
} from "prosemirror-suggestcat-plugin-react";
import { DemoLayout } from "../components/DemoLayout";

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/SuggestcatDemo.tsx";

const apiKey = "-qKivjCv6MfQSmgF438PjEY7RnLfqoVe";
const mainModel = "cerebras:gpt-oss-120b";

const initialDoc = schema.nodes.doc.create(null, [
  schema.nodes.heading.create({ level: 2 }, schema.text("Suggestcat Full Demo")),
  schema.nodes.paragraph.create(
    null,
    schema.text(
      "This editor has all Suggestcat features enabled: grammar checking, inline autocomplete, and AI actions via the slash menu.",
    ),
  ),
  schema.nodes.paragraph.create(
    null,
    schema.text(
      "This sentnce has a intentional mistake — the grammar checker will detect it and show a underlined decoration. Click the underline to see the suggestion popup.",
    ),
  ),
  schema.nodes.paragraph.create(
    null,
    schema.text(
      "Try selecting this sentence and pressing / to see AI actions like Complete, Simplify, Translate, and more.",
    ),
  ),
]);

function SuggestcatUsage() {
  return (
    <ul className="demo-usage-list">
      <li>
        <strong>Grammar checking</strong> runs automatically — mistakes
        appear as underlined decorations. Click to see the suggestion popup.
      </li>
      <li>
        <strong>Auto-complete</strong> suggests text as you type — press{" "}
        <code>Tab</code> to accept ghost text.
      </li>
      <li>
        <strong>Select text</strong> and press <code>/</code> to open the
        AI command menu (Complete, Simplify, Translate, Change Tone, etc.).
      </li>
      <li>
        <strong>Suggestion overlay</strong> shows streaming results that you
        can accept or reject.
      </li>
    </ul>
  );
}

function SuggestcatEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [grammarRunning, setGrammarRunning] = useState(true);
  const [autoCompleteOn, setAutoCompleteOn] = useState(true);

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

    const completePlugin = completePluginV2(apiKey, { model: mainModel });

    const autoComplete = autoCompletePlugin(apiKey, {
      model: mainModel,
      debounceMs: 2000,
    });

    const slashPlugin = SlashMenuPlugin(
      promptCommands,
      undefined,
      slashOpeningCondition,
    );

    const state = EditorState.create({
      doc: initialDoc,
      plugins: [
        grammarPlugin,
        completePlugin,
        autoComplete,
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

  const handleGrammarToggle = () => {
    const view = viewRef.current;
    if (!view) return;
    if (grammarRunning) {
      pauseRunner(view, grammarSuggestV2Key);
    } else {
      resumeRunner(view, grammarSuggestV2Key);
    }
    setGrammarRunning(!grammarRunning);
  };

  const handleGrammarReset = () => {
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
      setGrammarRunning(true);
    }, 10);
  };

  const handleAutoCompleteToggle = () => {
    const view = viewRef.current;
    if (!view) return;
    const current = isAutoCompleteEnabled(view);
    setAutoCompleteEnabled(view, !current);
    setAutoCompleteOn(!current);
  };

  return (
    <>
      <div className="suggestcat-controls">
        <button
          className={`suggestcat-toggle-btn ${grammarRunning ? "suggestcat-toggle-on" : "suggestcat-toggle-off"}`}
          onClick={handleGrammarToggle}
        >
          Grammar: {grammarRunning ? "Running" : "Paused"}
        </button>
        <button className="suggestcat-action-btn" onClick={handleGrammarReset}>
          Reset Grammar
        </button>
        <button
          className={`suggestcat-toggle-btn ${autoCompleteOn ? "suggestcat-toggle-on" : "suggestcat-toggle-off"}`}
          onClick={handleAutoCompleteToggle}
        >
          Autocomplete: {autoCompleteOn ? "ON" : "OFF"}
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

export function SuggestcatDemo() {
  return (
    <DemoLayout
      title="prosemirror-suggestcat-plugin"
      description={
        <>
          AI-powered grammar checking, text completion, and prompt-based editing.
          Includes a React UI layer with grammar popups, suggestion overlays,
          and slash menu integration for AI actions like translate, simplify,
          change tone, and more.
        </>
      }
      packageNames={["prosemirror-suggestcat-plugin", "prosemirror-suggestcat-plugin-react"]}
      sourceUrl={SOURCE_URL}
      usage={<SuggestcatUsage />}
    >
      <SuggestcatEditor />
    </DemoLayout>
  );
}
