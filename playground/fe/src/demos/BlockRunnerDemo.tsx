import { useCallback, useEffect, useRef, useState } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, Node } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { PluginKey } from "prosemirror-state";
import {
  ActionType,
  dispatchAction,
  pauseRunner,
  resumeRunner,
  createLinkDetectorPlugin,
  linkDetectorKey,
  createWordComplexityPlugin,
  wordComplexityKey,
  createSentenceLengthPlugin,
  sentenceLengthKey,
  createRandomProcessorPlugin,
  randomProcessorKey,
} from "@emergence-engineering/prosemirror-block-runner";
import { DemoLayout } from "../components/DemoLayout";

const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

type ExampleName = "linkDetector" | "wordComplexity" | "sentenceLength" | "randomProcessor";

const examples: { key: ExampleName; label: string; description: string }[] = [
  { key: "linkDetector", label: "Link Detector", description: "Detects URLs in text and highlights them as clickable links." },
  { key: "wordComplexity", label: "Word Complexity", description: "Highlights complex words based on syllable count (yellow = moderate, red = high)." },
  { key: "sentenceLength", label: "Sentence Length", description: "Flags long sentences (orange = warning, red = error)." },
  { key: "randomProcessor", label: "Random Processor", description: "Simulates async processing with random delays and errors. Shows retry/backoff behavior." },
];

// Use PluginKey<any> to allow dispatching to any example processor
const pluginKeys: Record<ExampleName, PluginKey<any>> = {
  linkDetector: linkDetectorKey,
  wordComplexity: wordComplexityKey,
  sentenceLength: sentenceLengthKey,
  randomProcessor: randomProcessorKey,
};

function createInitialDoc(): Node {
  const { nodes } = schema;
  return nodes.doc.create(null, [
    nodes.heading.create({ level: 2 }, [schema.text("Block Runner Demo")]),
    nodes.paragraph.create(null, [
      schema.text(
        "The block runner processes each paragraph independently through configurable worker functions. " +
        "Select an example processor below and click Init to start processing.",
      ),
    ]),
    nodes.paragraph.create(null, [
      schema.text(
        "This paragraph contains a URL: https://emergence-engineering.com — try the Link Detector to see it highlighted.",
      ),
    ]),
    nodes.paragraph.create(null, [
      schema.text(
        "Antidisestablishmentarianism and incomprehensibility are extraordinarily complicated words that should be detected by the Word Complexity processor.",
      ),
    ]),
    nodes.paragraph.create(null, [
      schema.text(
        "This is a very long sentence that keeps going and going and going with many words that should eventually trigger the sentence length warning because it has way too many words for a single sentence to reasonably contain without becoming difficult to read and understand by the average reader.",
      ),
    ]),
  ]);
}

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/BlockRunnerDemo.tsx";

function BlockRunnerUsage() {
  return (
    <ul className="demo-usage-list">
      <li>
        <strong>Select an example</strong> from the dropdown to choose a processor.
      </li>
      <li>
        Click <strong>Init</strong> to start processing all paragraphs.
      </li>
      <li>
        Use <strong>Pause/Resume</strong> to toggle processing.
      </li>
      <li>
        Click <strong>Clear</strong> to remove results for the selected processor,
        or <strong>Clear All</strong> to remove decorations from all processors at once.
      </li>
      <li>
        <strong>Edit text</strong> while processing — dirty blocks are automatically re-processed.
      </li>
    </ul>
  );
}

function BlockRunnerEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [activeExample, setActiveExample] = useState<ExampleName>("linkDetector");
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: createInitialDoc(),
      plugins: [
        ...exampleSetup({ schema, menuBar: false }),
        createLinkDetectorPlugin(),
        createWordComplexityPlugin(),
        createSentenceLengthPlugin(),
        createRandomProcessorPlugin(),
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

  const handleInit = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    const key = pluginKeys[activeExample];
    dispatchAction(view, key, { type: ActionType.INIT, metadata: { single: {} } });
    setIsPaused(false);
  }, [activeExample]);

  const handleClear = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    const key = pluginKeys[activeExample];
    dispatchAction(view, key, { type: ActionType.CLEAR });
    setIsPaused(false);
  }, [activeExample]);

  const handleClearAll = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    for (const key of Object.values(pluginKeys)) {
      dispatchAction(view, key, { type: ActionType.CLEAR });
    }
    setIsPaused(false);
  }, []);

  const handlePauseResume = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    const key = pluginKeys[activeExample];
    if (isPaused) {
      resumeRunner(view, key);
      setIsPaused(false);
    } else {
      pauseRunner(view, key);
      setIsPaused(true);
    }
  }, [activeExample, isPaused]);

  const currentExample = examples.find((e) => e.key === activeExample)!;

  return (
    <>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="card-header">
          <span className="card-label">Controls</span>
        </div>
        <div style={{ padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={activeExample}
            onChange={(e) => setActiveExample(e.target.value as ExampleName)}
            style={{ padding: "0.4rem 0.6rem", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            {examples.map((ex) => (
              <option key={ex.key} value={ex.key}>{ex.label}</option>
            ))}
          </select>
          <button onClick={handleInit} className="demo-button demo-button-primary">Init</button>
          <button onClick={handlePauseResume} className="demo-button">
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button onClick={handleClear} className="demo-button">Clear</button>
          <button onClick={handleClearAll} className="demo-button demo-button-danger">Clear All</button>
        </div>
        <div style={{ padding: "0 1rem 1rem", fontSize: "0.875rem", color: "#666" }}>
          {currentExample.description}
        </div>
      </div>

      <div className="card editor-card">
        <div className="card-header">
          <span className="card-label">Editor</span>
          <span className="card-hint">
            Init a processor, then edit text to see dirty re-processing
          </span>
        </div>
        <div ref={editorRef} />
      </div>
    </>
  );
}

export function BlockRunnerDemo() {
  return (
    <DemoLayout
      title="@emergence-engineering/prosemirror-block-runner"
      description={
        <>
          A generic task queue processor for ProseMirror. It processes each document
          block (paragraph) through configurable parallel workers with state management,
          retry logic, and visual feedback decorations.
        </>
      }
      packageNames={["@emergence-engineering/prosemirror-block-runner"]}
      sourceUrl={SOURCE_URL}
      usage={<BlockRunnerUsage />}
    >
      <BlockRunnerEditor />
    </DemoLayout>
  );
}
