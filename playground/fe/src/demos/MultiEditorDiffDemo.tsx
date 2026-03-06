import { useEffect, useRef, useState } from "react";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Node, Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  createMultiEditorDiffVisuPlugin,
  multiEditorDiffStateHolder,
} from "@emergence-engineering/prosemirror-multi-editor-diff";
import { DemoLayout } from "../components/DemoLayout";

const schema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: basicSchema.spec.marks,
});

function createLeftDoc(): Node {
  const { nodes } = schema;
  return nodes.doc.create(null, [
    nodes.heading.create({ level: 2 }, [schema.text("Project Overview")]),
    nodes.paragraph.create(null, [
      schema.text(
        "ProseMirror is a toolkit for building rich-text editors on the web. It provides a set of tools and concepts for building editors that feel native to the web platform.",
      ),
    ]),
    nodes.heading.create({ level: 3 }, [schema.text("Architecture")]),
    nodes.paragraph.create(null, [
      schema.text(
        "The editor uses a functional architecture where the document is an immutable data structure. State changes are applied through transactions that produce a new state.",
      ),
    ]),
    nodes.paragraph.create(null, [
      schema.text(
        "Plugins extend the editor with additional functionality. Each plugin can define its own state, handle transactions, and add decorations to the view.",
      ),
    ]),
    nodes.heading.create({ level: 3 }, [schema.text("Diff Visualization")]),
    nodes.paragraph.create(null, [
      schema.text(
        "The multi-editor diff plugin compares two documents side by side. It pairs nodes between the editors using sequence alignment and highlights the differences inline.",
      ),
    ]),
    nodes.paragraph.create(null, [
      schema.text(
        "Spacer decorations are inserted to keep paired nodes vertically aligned across both editors, making it easy to see which parts correspond to each other.",
      ),
    ]),
    nodes.paragraph.create(null, [
      schema.text(
        "This paragraph only exists in the left editor and will show as a deletion on the right side.",
      ),
    ]),
  ]);
}

function createRightDoc(): Node {
  const { nodes } = schema;
  return nodes.doc.create(null, [
    nodes.heading.create({ level: 2 }, [schema.text("Project Overview")]),
    nodes.paragraph.create(null, [
      schema.text(
        "ProseMirror is a powerful toolkit for building collaborative rich-text editors on the web. It provides a comprehensive set of tools and concepts for building editors.",
      ),
    ]),
    nodes.heading.create({ level: 3 }, [schema.text("Architecture")]),
    nodes.paragraph.create(null, [
      schema.text(
        "The editor uses a functional architecture where the document is an immutable tree data structure. State changes are applied through transactions that produce a new editor state.",
      ),
    ]),
    nodes.paragraph.create(null, [
      schema.text(
        "Plugins extend the editor with additional functionality. Each plugin can define its own state slice, handle incoming transactions, and add decorations to the rendered view.",
      ),
    ]),
    nodes.paragraph.create(null, [
      schema.text(
        "This paragraph was added in the right editor and will show as an insertion.",
      ),
    ]),
    nodes.heading.create({ level: 3 }, [schema.text("Diff Visualization")]),
    nodes.paragraph.create(null, [
      schema.text(
        "The multi-editor diff plugin compares two ProseMirror documents side by side. It pairs nodes between editors using a sequence alignment algorithm and highlights changes with inline decorations.",
      ),
    ]),
    nodes.paragraph.create(null, [
      schema.text(
        "Spacer widgets are inserted to keep paired nodes vertically aligned across both editors, so users can easily see which parts of the documents correspond to each other.",
      ),
    ]),
  ]);
}

const SOURCE_URL =
  "https://github.com/emergence-engineering/emergence-tools/blob/main/playground/fe/src/demos/MultiEditorDiffDemo.tsx";

function MultiEditorDiffUsage() {
  return (
    <ul className="demo-usage-list">
      <li>
        Click <strong>Show Diff</strong> to visualize differences between the two editors.
      </li>
      <li>
        <strong>Edit text</strong> in either editor — the diff updates automatically.
      </li>
      <li>
        Click <strong>Hide Diff</strong> to remove the diff visualization.
      </li>
      <li>
        <span className="highlight-addition" style={{ padding: "0 2px" }}>Green highlights</span> show added text,{" "}
        <span className="highlight-deletion" style={{ padding: "0 2px" }}>red highlights</span> show deleted text.
      </li>
    </ul>
  );
}

function MultiEditorDiffEditor() {
  const leftEditorRef = useRef<HTMLDivElement>(null);
  const rightEditorRef = useRef<HTMLDivElement>(null);
  const leftViewRef = useRef<EditorView | null>(null);
  const rightViewRef = useRef<EditorView | null>(null);
  const stateHolderRef = useRef(multiEditorDiffStateHolder());
  const [showDiff, setShowDiff] = useState(false);
  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!leftEditorRef.current || !rightEditorRef.current) return;

    const leftState = EditorState.create({
      doc: createLeftDoc(),
      plugins: [
        ...exampleSetup({ schema, menuBar: false }),
        createMultiEditorDiffVisuPlugin(),
      ],
    });

    const rightState = EditorState.create({
      doc: createRightDoc(),
      plugins: [
        ...exampleSetup({ schema, menuBar: false }),
        createMultiEditorDiffVisuPlugin(),
      ],
    });

    leftViewRef.current = new EditorView(leftEditorRef.current, {
      state: leftState,
      dispatchTransaction(tr: Transaction) {
        const newState = leftViewRef.current!.state.apply(tr);
        leftViewRef.current!.updateState(newState);
      },
    });

    rightViewRef.current = new EditorView(rightEditorRef.current, {
      state: rightState,
      dispatchTransaction(tr: Transaction) {
        const newState = rightViewRef.current!.state.apply(tr);
        rightViewRef.current!.updateState(newState);
      },
    });

    const stateHolder = stateHolderRef.current;
    stateHolder.addEditor(
      { uuid: "left", versionId: 1 },
      leftViewRef.current,
      leftScrollRef,
    );
    stateHolder.addEditor(
      { uuid: "right", versionId: 1 },
      rightViewRef.current,
      rightScrollRef,
    );
    stateHolder.selectEditor("left", { uuid: "left", versionId: 1 });
    stateHolder.selectEditor("right", { uuid: "right", versionId: 1 });

    return () => {
      leftViewRef.current?.destroy();
      rightViewRef.current?.destroy();
      leftViewRef.current = null;
      rightViewRef.current = null;
    };
  }, []);

  const handleToggleDiff = () => {
    const newValue = !showDiff;
    stateHolderRef.current.switchShowDiff(newValue);
    setShowDiff(newValue);
  };

  return (
    <>
      <style>{`
        .highlight-addition {
          background-color: rgba(0, 200, 0, 0.25);
        }
        .highlight-deletion {
          background-color: rgba(255, 0, 0, 0.2);
        }
        .multi-editor-diff.empty-rect {
          width: 100%;
        }
        .multi-editor-diff.loading-icon {
          display: inline-block;
          width: 8px;
          height: 8px;
          border: 2px solid #ccc;
          border-top-color: #666;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-left: 4px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .multi-editor-diff.non-matching-node-type,
        .multi-editor-diff.non-matching-node-level,
        .multi-editor-diff.non-matching-node-parent-length,
        .multi-editor-diff.non-matching-node-parent-type {
          display: inline-block;
          background: #ff9800;
          color: white;
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 3px;
          margin-right: 4px;
        }
      `}</style>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="card-header">
          <span className="card-label">Controls</span>
        </div>
        <div style={{ padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button onClick={handleToggleDiff} className={`demo-button ${showDiff ? "" : "demo-button-primary"}`}>
            {showDiff ? "Hide Diff" : "Show Diff"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="card editor-card">
          <div className="card-header">
            <span className="card-label">Left Editor (Version A)</span>
          </div>
          <div ref={leftScrollRef} style={{ overflow: "auto" }}>
            <div ref={leftEditorRef} />
          </div>
        </div>

        <div className="card editor-card">
          <div className="card-header">
            <span className="card-label">Right Editor (Version B)</span>
          </div>
          <div ref={rightScrollRef} style={{ overflow: "auto" }}>
            <div ref={rightEditorRef} />
          </div>
        </div>
      </div>
    </>
  );
}

export function MultiEditorDiffDemo() {
  return (
    <DemoLayout
      title="@emergence-engineering/prosemirror-multi-editor-diff"
      demoKey="multiEditorDiff"
      description={
        <>
          Multi-editor diff visualization for ProseMirror. Compare two editors
          side-by-side with inline diff decorations, spacer synchronization, and
          automatic node pairing using sequence alignment.
        </>
      }
      packageNames={["@emergence-engineering/prosemirror-multi-editor-diff"]}
      sourceUrl={SOURCE_URL}
      usage={<MultiEditorDiffUsage />}
    >
      <MultiEditorDiffEditor />
    </DemoLayout>
  );
}
