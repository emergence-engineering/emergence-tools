import { useEffect, useRef } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";

export function BasicEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      schema,
      plugins: exampleSetup({ schema }),
    });

    viewRef.current = new EditorView(editorRef.current, { state });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, []);

  return (
    <div>
      <div className="demo-header">
        <h1 className="demo-title">Basic Editor</h1>
        <p className="demo-description">
          Base ProseMirror editor with example-setup. Use this as a starting
          point for plugin demos.
        </p>
      </div>
      <div className="card editor-card">
        <div ref={editorRef} />
      </div>
    </div>
  );
}