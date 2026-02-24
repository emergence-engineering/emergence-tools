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
      <h2>Basic ProseMirror Editor</h2>
      <p style={{ color: "#666" }}>
        Base editor with example-setup. Use this as a starting point for plugin
        demos.
      </p>
      <div
        ref={editorRef}
        style={{
          border: "1px solid #ddd",
          borderRadius: 4,
          minHeight: 300,
        }}
      />
    </div>
  );
}